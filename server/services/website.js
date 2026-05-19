// Detection et evaluation de la qualite du site web de l'entreprise.

import { normalize, stripAccents } from './match.js';

const FETCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Genere des noms de domaine plausibles a partir du nom de l'enseigne.
// "MA BOUTIQUE" -> maboutique, ma-boutique (lettres isolees fusionnees).
function domainCandidates(name) {
  const words = normalize(name).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  // Fusionne les suites de lettres isolees : ["m","b","conseil"] -> ["mb","conseil"].
  const parts = [];
  for (const w of words) {
    if (w.length === 1 && parts.length && parts[parts.length - 1].solo) {
      parts[parts.length - 1].v += w;
    } else {
      parts.push({ v: w, solo: w.length === 1 });
    }
  }
  const merged = parts.map((p) => p.v);
  const bases = [...new Set([merged.join(''), merged.join('-'), words.join(''), words.join('-')])]
    .filter((b) => b.length >= 4 && b.length <= 40);
  const urls = [];
  for (const b of bases) {
    for (const tld of ['.fr', '.com']) urls.push(`https://${b}${tld}`);
  }
  return urls;
}

const PARKING = /domain.{0,20}(for sale|a vendre)|parkingcrew|sedoparking|bodis\.com|afternic/i;

// Sonde un domaine devine : 200, page reelle, non parquee.
async function probeDomain(url) {
  try {
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': FETCH_UA },
      signal: AbortSignal.timeout(7000),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    if (html.length < 800 || PARKING.test(stripAccents(html))) return null;
    return resp.url || url;
  } catch {
    return null;
  }
}

// Cherche le site en devinant le domaine quand la recherche n'a rien donne.
export async function discoverWebsite(entreprise) {
  const candidates = domainCandidates(entreprise.queryNom);
  const results = await Promise.all(candidates.map((u) => probeDomain(u)));
  return results.find(Boolean) || null;
}

// Note de qualite sur 15 a partir des balises et de la vitesse.
function scoreQuality(q) {
  let score = 0;
  if (q.https) score += 4;
  if (q.viewport) score += 3;
  if (q.title) score += 2;
  if (q.description) score += 2;
  if (q.h1) score += 1;
  if (q.speedRating === 'rapide') score += 3;
  else if (q.speedRating === 'moyen') score += 2;
  else if (q.speedRating === 'lent') score += 1;
  return score;
}

export async function checkWebsite(url) {
  if (!url) {
    return { status: 'ok', found: false, url: null, quality: null, qualityScore: 0 };
  }
  try {
    const start = Date.now();
    const resp = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': FETCH_UA },
      signal: AbortSignal.timeout(10000),
    });
    const responseMs = Date.now() - start;
    const html = await resp.text();
    const finalUrl = resp.url || url;

    const quality = {
      statusCode: resp.status,
      https: finalUrl.startsWith('https:'),
      viewport: /<meta[^>]+name=["']?viewport["']?/i.test(html),
      title: /<title[^>]*>\s*\S/i.test(html),
      description: /<meta[^>]+name=["']?description["']?[^>]*content=["'][^"']{10,}/i.test(html),
      h1: /<h1[\s>]/i.test(html),
      responseMs,
      speedRating: responseMs < 800 ? 'rapide' : responseMs < 2500 ? 'moyen' : 'lent',
    };
    const qualityScore = scoreQuality(quality);
    return { status: 'ok', found: true, url: finalUrl, quality, qualityScore };
  } catch (err) {
    // Site detecte mais injoignable : on le compte comme present sans note de qualite.
    return {
      status: 'unreachable',
      found: true,
      url,
      quality: null,
      qualityScore: 0,
      error: 'Site detecte mais injoignable (timeout ou erreur reseau).',
    };
  }
}
