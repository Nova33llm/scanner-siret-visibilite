import { newContext } from '../browser.js';
import { getCache, setCache } from './cache.js';
import { stripAccents } from './match.js';

// Recherche web multi-moteurs via Playwright.
// Google est tente en premier (best effort, souvent bloque par captcha).
// Bing prend le relais pour la presence SERP. DuckDuckGo gere les requetes
// "site:" que Bing refuse.

const MAX_CONCURRENT = 3;
let active = 0;
const waiting = [];

// Disjoncteur Google : une fois bloque, on cesse de l'interroger 20 minutes.
let googleBlockedUntil = 0;

function acquireSlot() {
  return new Promise((resolve) => {
    const tryRun = () => {
      if (active < MAX_CONCURRENT) {
        active += 1;
        resolve();
      } else {
        waiting.push(tryRun);
      }
    };
    tryRun();
  });
}

function releaseSlot() {
  active -= 1;
  const next = waiting.shift();
  if (next) next();
}

async function withSlot(fn) {
  await acquireSlot();
  try {
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 450));
    return await fn();
  } finally {
    releaseSlot();
  }
}

// --- Google ---------------------------------------------------------------

async function dismissConsent(page) {
  try {
    if (page.url().includes('consent.google.')) {
      const btn = page
        .locator(
          'button:has-text("Tout accepter"), button:has-text("Accept all"), button:has-text("J\'accepte")',
        )
        .first();
      await btn.click({ timeout: 4000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    }
  } catch {
    // Pas de bandeau, on continue.
  }
}

async function googleEngine(query) {
  const ctx = await newContext();
  const page = await ctx.newPage();
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=fr&gl=fr`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await dismissConsent(page);
    if (page.url().includes('/sorry/')) return { status: 'blocked' };
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const links = [...document.querySelectorAll('a[href^="http"]')]
        .map((a) => ({ href: a.href, title: (a.innerText || '').trim() }))
        .filter((l) => !/google\.[a-z.]+\//i.test(l.href));
      return { text, links };
    });
    if (/trafic (exceptionnel|inhabituel)|unusual traffic/i.test(data.text)) {
      return { status: 'blocked' };
    }
    return { status: 'ok', engine: 'google', text: data.text, links: data.links };
  } catch {
    return { status: 'blocked' };
  } finally {
    await ctx.close();
  }
}

// --- Google Custom Search API (optionnel) ---------------------------------

// Si GOOGLE_API_KEY et GOOGLE_CSE_ID sont definis, on interroge l'API officielle
// Google Programmable Search : vrais resultats Google, fiables, sans captcha.
// Quota gratuit : 100 requetes par jour.
function hasGoogleApi() {
  return Boolean(process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID);
}

async function googleApiEngine(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  const url =
    'https://www.googleapis.com/customsearch/v1' +
    `?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}` +
    `&q=${encodeURIComponent(query)}&hl=fr&gl=fr&num=10`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) {
      // 429 = quota epuise, 403 = cle invalide : on bascule sur les autres moteurs.
      return { status: 'blocked' };
    }
    const data = await resp.json();
    const items = data.items || [];
    const links = items.map((it) => ({ href: it.link, title: it.title || '' }));
    const text = items.map((it) => `${it.title} ${it.snippet || ''}`).join('\n');
    return { status: 'ok', engine: 'google', text, links };
  } catch {
    return { status: 'blocked' };
  }
}

// --- Bing -----------------------------------------------------------------

async function dismissBingConsent(page) {
  try {
    const accept = page
      .locator('#bnp_btn_accept, button:has-text("Accepter"), button:has-text("Accept")')
      .first();
    if (await accept.isVisible({ timeout: 2500 })) {
      await accept.click();
      await page.waitForTimeout(600);
    }
  } catch {
    // Pas de bandeau de consentement, on continue.
  }
}

async function bingEngine(query) {
  const ctx = await newContext();
  const page = await ctx.newPage();
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&mkt=fr-FR&setlang=fr&cc=FR`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await dismissBingConsent(page);
    await page.waitForSelector('#b_results', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => {
      // Les liens organiques Bing sont enrobes : bing.com/ck/a?...&u=a1<base64>.
      const decode = (href) => {
        if (!href || !href.includes('bing.com/ck/a')) return href;
        try {
          const u = new URL(href).searchParams.get('u') || '';
          if (u.startsWith('a1')) {
            const b64 = u.slice(2).replace(/-/g, '+').replace(/_/g, '/');
            return decodeURIComponent(escape(atob(b64)));
          }
        } catch {
          /* lien non decodable */
        }
        return href;
      };
      const links = [...document.querySelectorAll('#b_results li.b_algo')]
        .map((li) => {
          const a = li.querySelector('h2 a');
          return { href: decode(a?.href || ''), title: (a?.innerText || '').trim() };
        })
        .filter((l) => /^https?:\/\//i.test(l.href) && !/(bing|microsoft|msn)\.com/i.test(l.href));
      return { text: document.body.innerText || '', links };
    });
    if (/resoudre le defi|verifier que vous etes|solve the challenge/i.test(
      stripAccents(data.text),
    )) {
      return { status: 'blocked' };
    }
    return { status: 'ok', engine: 'bing', text: data.text, links: data.links };
  } catch {
    return { status: 'blocked' };
  } finally {
    await ctx.close();
  }
}

// --- DuckDuckGo (requetes site:) ------------------------------------------

async function ddgEngine(query) {
  const ctx = await newContext();
  const page = await ctx.newPage();
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    await page.waitForTimeout(300);
    const data = await page.evaluate(() => {
      // Les liens DDG sont enrobes : //duckduckgo.com/l/?uddg=<url encodee>.
      const decode = (href) => {
        try {
          const u = new URL(href, 'https://duckduckgo.com');
          return u.searchParams.get('uddg') || href;
        } catch {
          return href;
        }
      };
      const links = [...document.querySelectorAll('a.result__a')]
        .map((a) => ({ href: decode(a.href), title: (a.innerText || '').trim() }))
        // On ecarte les liens publicitaires (y.js) restes sur duckduckgo.com.
        .filter((l) => /^https?:\/\//i.test(l.href) && !/duckduckgo\.com/i.test(l.href));
      return { text: document.body.innerText || '', links };
    });
    return { status: 'ok', engine: 'ddg', text: data.text, links: data.links };
  } catch {
    return { status: 'blocked' };
  } finally {
    await ctx.close();
  }
}

// --- Validation et reessais -----------------------------------------------

// Bing sert parfois des resultats sans rapport avec la requete (anti-scraping).
// On verifie qu'au moins un mot significatif de la requete apparait dans les titres.
function looksRelevant(query, links) {
  const tokens = stripAccents(query).toLowerCase().match(/[a-z0-9]{4,}/g) || [];
  if (tokens.length === 0) return true;
  const haystack = stripAccents(links.map((l) => l.title).join(' ')).toLowerCase();
  return tokens.some((t) => haystack.includes(t));
}

// Interroge un moteur avec reessais : un jeu de resultats hors-sujet est rejete.
async function searchWithRetry(engineFn, query, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    const r = await engineFn(query);
    if (r.status === 'ok' && looksRelevant(query, r.links)) return r;
    await new Promise((rs) => setTimeout(rs, 400 + Math.random() * 600));
  }
  return { status: 'blocked' };
}

// --- API publique ---------------------------------------------------------

// Recherche de presence. Ordre : Google (best effort), puis DuckDuckGo (fiable),
// puis Bing en dernier recours.
export async function webSearch(query, { tryGoogle = false } = {}) {
  const key = `web:${query.toLowerCase().trim()}`;
  const cached = getCache(key);
  if (cached) return { ...cached, cached: true };

  return withSlot(async () => {
    // 1. API Google officielle si une cle est configuree (fiable, prioritaire).
    if (hasGoogleApi()) {
      const api = await googleApiEngine(query);
      if (api.status === 'ok') {
        setCache(key, api);
        return api;
      }
      // Quota epuise ou cle invalide : on continue avec les moteurs scrapes.
    } else if (tryGoogle && Date.now() > googleBlockedUntil) {
      // 2. A defaut de cle, tentative de scraping Google (souvent bloque).
      const g = await googleEngine(query);
      if (g.status === 'ok' && looksRelevant(query, g.links)) {
        setCache(key, g);
        return g;
      }
      googleBlockedUntil = Date.now() + 20 * 60 * 1000;
    }
    const d = await searchWithRetry(ddgEngine, query);
    if (d.status === 'ok') {
      setCache(key, d);
      return d;
    }
    const b = await searchWithRetry(bingEngine, query);
    if (b.status === 'ok') setCache(key, b);
    return b;
  });
}

// Recherche restreinte a un domaine via DuckDuckGo.
export async function siteSearch(domain, query) {
  const full = `site:${domain} ${query}`;
  const key = `site:${full.toLowerCase().trim()}`;
  const cached = getCache(key);
  if (cached) return { ...cached, cached: true };

  return withSlot(async () => {
    const r = await ddgEngine(full);
    if (r.status === 'ok') setCache(key, r);
    return r;
  });
}
