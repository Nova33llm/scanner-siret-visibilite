import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

// Le plugin stealth masque les marqueurs d'automatisation (navigator.webdriver,
// signatures headless) qui declenchent les captchas.
chromium.use(stealth());

// Navigateur Playwright unique reutilise pour tout le processus.
// Un contexte neuf par requete, avec rotation du user-agent.
let browser = null;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

export function pickUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    });
  }
  return browser;
}

export async function newContext() {
  const b = await getBrowser();
  const ctx = await b.newContext({
    userAgent: pickUserAgent(),
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 1366, height: 768 },
  });
  // Cookies de consentement Google, evite la page interstitielle dans la plupart des cas.
  await ctx.addCookies([
    {
      name: 'CONSENT',
      value: 'YES+cb.20210720-07-p0.fr+FX+410',
      domain: '.google.com',
      path: '/',
    },
    {
      name: 'SOCS',
      value: 'CAESHAgBEhJnd3NfMjAyNDA5MDMtMF9SQzEaAmZyIAEaBgiAo_CmBg',
      domain: '.google.com',
      path: '/',
    },
  ]);
  return ctx;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
