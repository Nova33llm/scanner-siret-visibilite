import { webSearch } from './serp.js';
import { textMentions, hostOf, stripAccents, normalize } from './match.js';

// Analyse de la presence en ligne : apparition SERP, fiche Google Business,
// detection du site web officiel.

// Hotes ignores pour la detection du site officiel (annuaires, reseaux sociaux).
const NON_SITE_HOSTS = [
  'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'twitter.com',
  'x.com', 'tiktok.com', 'pinterest.fr', 'pinterest.com',
  'pagesjaunes.fr', 'yelp.fr', 'yelp.com', 'tripadvisor.fr', 'tripadvisor.com',
  'thefork.fr', 'thefork.com', 'lafourchette.com', 'planity.com', 'treatwell.fr',
  'ubereats.com', 'deliveroo.fr', 'just-eat.fr',
  'societe.com', 'pappers.fr', 'infogreffe.fr', 'verif.com', 'manageo.fr',
  'data.gouv.fr', 'annuaire-entreprises.data.gouv.fr', 'bodacc.fr', 'inpi.fr',
  'wikipedia.org', 'mappy.com', 'bing.com', 'duckduckgo.com',
  'guide.michelin.com', 'petitfute.com', 'gaultmillau.com',
  '118000.fr', '118712.fr', 'justacote.com', 'cylex-france.fr', 'kompass.com',
  'local.fr', 'wanted-immo.fr', 'le-guide.com', 'myboulange.fr', 'happycurio.com',
];

function isCandidateSite(url) {
  const host = hostOf(url);
  if (!host) return false;
  return !NON_SITE_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`));
}

// Detecte le site officiel parmi les liens organiques.
// On exige que le nom de domaine reprenne un mot significatif du nom de
// l'enseigne (fnac.com pour "Relais Fnac", latupina.com pour "La Tupina").
// Un annuaire qui affiche le nom dans son seul titre ne compte pas.
function pickWebsite(serp, entreprise) {
  if (!serp || serp.status !== 'ok') return null;
  const tokens = normalize(entreprise.queryNom)
    .split(' ')
    .filter((w) => w.length >= 4);
  if (tokens.length === 0) return null;
  const matched = serp.links
    .filter((l) => isCandidateSite(l.href))
    .find((l) => {
      const host = normalize(hostOf(l.href));
      return tokens.some((t) => host.includes(t));
    });
  return matched?.href || null;
}

// Plateformes d'avis et de fiches d'etablissement.
const REVIEW_HOSTS = [
  'google.com/maps', 'g.page', 'goo.gl/maps', 'maps.app.goo.gl',
  'tripadvisor.', 'yelp.', 'trustpilot.', 'pagesjaunes.fr',
  'thefork.', 'lafourchette.', 'planity.com', 'treatwell.',
];

// Detecte la presence d'une fiche d'etablissement et, si possible, la note
// et le nombre d'avis. Sources : panneau Google quand disponible, sinon
// presence sur les plateformes d'avis et extraction depuis les resultats.
function parseBusiness(serp) {
  if (!serp || serp.status !== 'ok') {
    return {
      status: 'indetermine',
      found: false,
      note: null,
      avis: null,
      source: null,
      message: 'Verification impossible : aucun moteur de recherche accessible.',
    };
  }
  const text = stripAccents(serp.text);

  // Note sur 5 (ex: "4,6 etoiles", "4,6 sur 5", "Note 4,6").
  const noteMatch =
    text.match(/\b([1-5][.,]\d)\b(?=\s*(?:etoile|star|sur\s*5|\/\s*5|★|\())/i) ||
    text.match(/\bnote\s*:?\s*([1-5][.,]\d)\b/i) ||
    text.match(/\b([1-5][.,]\d)\b(?=[\s\S]{0,30}avis)/i);
  const note = noteMatch ? parseFloat(noteMatch[1].replace(',', '.')) : null;

  // Nombre d'avis (ex: "1 998 avis", "See 1,998 reviews").
  const avisMatch =
    text.match(/([\d][\d\s.,]{0,9})\s*avis/i) ||
    text.match(/([\d][\d\s.,]{0,9})(?:\s+\w+){0,2}\s+reviews?/i);
  const avisRaw = avisMatch ? parseInt(avisMatch[1].replace(/[^\d]/g, ''), 10) : null;
  const avis = Number.isNaN(avisRaw) || avisRaw === 0 ? null : avisRaw;

  // Presence sur au moins une plateforme d'avis parmi les resultats.
  const onPlatform = serp.links.some((l) =>
    REVIEW_HOSTS.some((h) => l.href.toLowerCase().includes(h)),
  );

  const found = onPlatform || note != null || avis != null;
  const source = serp.engine === 'google' ? 'Google' : 'plateformes d\'avis';
  return { status: 'ok', found, note, avis, source };
}

// Verifie l'apparition de l'entreprise dans les resultats d'un SERP.
// On exige une correspondance dans le titre ou l'hote d'un resultat,
// pas seulement dans le texte global de la page (trop permissif).
function appearsIn(serp, entreprise) {
  if (!serp || serp.status !== 'ok') return null;
  const name = entreprise.queryNom;
  return serp.links.some(
    (l) => textMentions(l.title, name) || textMentions(hostOf(l.href), name),
  );
}

export async function checkVisibility(entreprise) {
  const requeteNom = `${entreprise.queryNom} ${entreprise.ville}`.trim();
  const requeteMetierVille = `${entreprise.metier} ${entreprise.ville}`.trim();

  // La requete "nom" tente Google (pour recuperer la fiche Business).
  // La requete "metier" passe directement par Bing pour gagner du temps.
  const [serpNom, serpMetier] = await Promise.all([
    webSearch(requeteNom, { tryGoogle: true }),
    webSearch(requeteMetierVille, { tryGoogle: false }),
  ]);

  const serpStatus = serpNom.status === 'ok' || serpMetier.status === 'ok' ? 'ok' : 'blocked';
  const engine = serpNom.engine || serpMetier.engine || null;

  const serp = {
    status: serpStatus,
    engine,
    requeteNom,
    requeteMetierVille,
    presentNom: appearsIn(serpNom, entreprise),
    presentMetierVille: appearsIn(serpMetier, entreprise),
  };

  const business = parseBusiness(serpNom);
  const websiteUrl = pickWebsite(serpNom, entreprise);
  // Liens du SERP "nom enseigne", reutilises pour reperer les annuaires.
  const serpLinks = serpNom.status === 'ok' ? serpNom.links : [];

  return { serp, business, websiteUrl, serpLinks };
}
