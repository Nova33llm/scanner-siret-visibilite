import { resolveEntreprise } from './services/siret.js';
import { checkVisibility } from './services/google.js';
import { checkWebsite, discoverWebsite } from './services/website.js';
import { checkDirectories } from './services/directories.js';
import { computeScore } from './services/score.js';
import { generateAdvice } from './services/advice.js';
import { getCache, setCache } from './services/cache.js';

// Champs de l'entreprise exposes dans le rapport.
function publicEntreprise(e) {
  return {
    siret: e.siret,
    siren: e.siren,
    nom: e.nom,
    enseigne: e.enseigne,
    adresse: e.adresse,
    codePostal: e.codePostal,
    ville: e.ville,
    naf: e.naf,
    nafLibelle: e.nafLibelle,
    categorie: e.categorie,
    etat: e.etat,
  };
}

export async function runScan({ siret, nom, ville }) {
  const started = Date.now();

  // Etape 1 : resolution de l'entreprise via l'API publique.
  const entreprise = await resolveEntreprise({ siret, nom, ville });

  // Cache du scan complet (15 min) pour ne pas resolliciter les sources.
  const cacheKey = `scan:${entreprise.siret}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return { ...cached, meta: { ...cached.meta, cached: true } };
  }

  // Etape 2 : presence en ligne (SERP, fiche Business, detection du site).
  const visibility = await checkVisibility(entreprise);

  // Etape 3 : site web et annuaires en parallele.
  // Si la recherche n'a pas trouve de site, on tente de deviner le domaine.
  const websiteUrl = visibility.websiteUrl || (await discoverWebsite(entreprise));
  const [website, directories] = await Promise.all([
    checkWebsite(websiteUrl),
    checkDirectories(entreprise, visibility.business, visibility.serpLinks),
  ]);

  // Etape 4 : score.
  const score = computeScore({
    google: visibility.serp,
    googleBusiness: visibility.business,
    website,
    directories,
  });

  const advice = generateAdvice({
    google: visibility.serp,
    googleBusiness: visibility.business,
    website,
    directories,
  });

  const report = {
    entreprise: publicEntreprise(entreprise),
    google: visibility.serp,
    googleBusiness: visibility.business,
    website,
    directories,
    score,
    advice,
    meta: {
      durationMs: Date.now() - started,
      cached: false,
      engine: visibility.serp.engine,
      generatedAt: new Date().toISOString(),
    },
  };

  setCache(cacheKey, report);
  return report;
}
