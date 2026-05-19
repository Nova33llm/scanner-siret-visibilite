import { siteSearch } from './serp.js';
import { textMentions, hostOf } from './match.js';

// Annuaires verifies selon la categorie metier.
// L'entree "Google Maps" est resolue via la fiche Google Business.
const ANNUAIRES = {
  resto: [
    { name: 'Pages Jaunes', domain: 'pagesjaunes.fr' },
    { name: 'Yelp', domain: 'yelp.fr' },
    { name: 'TheFork', domain: 'thefork.fr' },
    { name: 'Tripadvisor', domain: 'tripadvisor.fr' },
  ],
  beaute: [
    { name: 'Pages Jaunes', domain: 'pagesjaunes.fr' },
    { name: 'Planity', domain: 'planity.com' },
    { name: 'Treatwell', domain: 'treatwell.fr' },
  ],
  autre: [
    { name: 'Pages Jaunes', domain: 'pagesjaunes.fr' },
    { name: 'Yelp', domain: 'yelp.fr' },
    { name: 'Google Maps', domain: 'maps.google.com', source: 'gbp' },
  ],
};

// Un lien correspond a l'annuaire si son hote est le domaine (ou un sous-domaine,
// pays inclus : tripadvisor.fr et tripadvisor.com).
function matchesDomain(href, domain) {
  const host = hostOf(href);
  if (!host) return false;
  const base = domain.replace(/\.[a-z]+$/, ''); // "tripadvisor.fr" -> "tripadvisor"
  return host === domain || host.endsWith(`.${domain}`) || host.includes(`${base}.`);
}

async function checkOnDirectory(annuaire, nom, ville, serpLinks) {
  // 1. Reperage direct dans le SERP "nom enseigne" (rapide, fiable).
  const inSerp = serpLinks.some(
    (l) => matchesDomain(l.href, annuaire.domain) && textMentions(l.title, nom),
  );
  if (inSerp) {
    return { name: annuaire.name, domain: annuaire.domain, found: true, status: 'ok' };
  }
  // 2. Sinon, requete restreinte au domaine via DuckDuckGo.
  const serp = await siteSearch(annuaire.domain, `${nom} ${ville}`);
  if (serp.status !== 'ok') {
    return { name: annuaire.name, domain: annuaire.domain, found: null, status: 'indetermine' };
  }
  const found = serp.links.some(
    (l) => matchesDomain(l.href, annuaire.domain) && textMentions(l.title, nom),
  );
  return { name: annuaire.name, domain: annuaire.domain, found, status: 'ok' };
}

export async function checkDirectories(entreprise, googleBusiness, serpLinks = []) {
  const list = ANNUAIRES[entreprise.categorie] || ANNUAIRES.autre;
  const nom = entreprise.queryNom;

  const items = await Promise.all(
    list.map((annuaire) => {
      if (annuaire.source === 'gbp') {
        // Presence Google Maps deduite de la fiche Google Business.
        if (!googleBusiness || googleBusiness.status !== 'ok') {
          return Promise.resolve({
            name: annuaire.name,
            domain: annuaire.domain,
            found: null,
            status: 'indetermine',
          });
        }
        return Promise.resolve({
          name: annuaire.name,
          domain: annuaire.domain,
          found: !!googleBusiness.found,
          status: 'ok',
        });
      }
      return checkOnDirectory(annuaire, nom, entreprise.ville, serpLinks);
    }),
  );

  const checked = items.filter((i) => i.status === 'ok');
  return {
    status: checked.length > 0 ? 'ok' : 'blocked',
    categorie: entreprise.categorie,
    items,
  };
}
