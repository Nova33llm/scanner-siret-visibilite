import { normalizeNaf, describeNaf } from './naf.js';

// Resolution d'une entreprise via l'API publique recherche-entreprises.api.gouv.fr.
const API = 'https://recherche-entreprises.api.gouv.fr/search';

export function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

// Validation Luhn d'un numero (SIREN ou SIRET).
export function luhn(num) {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

// Valide un SIRET : 14 chiffres plus cle de controle.
// Exception La Poste (SIREN 356000000) : somme des chiffres divisible par 5.
export function validateSiret(siret) {
  const clean = String(siret || '').replace(/\s/g, '');
  if (!/^\d{14}$/.test(clean)) return false;
  if (clean.startsWith('356000000')) {
    const sum = clean.split('').reduce((s, d) => s + Number(d), 0);
    return sum % 5 === 0;
  }
  return luhn(clean);
}

async function fetchApi(query) {
  const url = `${API}?q=${encodeURIComponent(query)}&page=1&per_page=10`;
  let resp;
  try {
    resp = await fetch(url, {
      headers: { 'User-Agent': 'scanner-siret/0.1 (outil local)' },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw httpError(503, 'API_UNAVAILABLE', "L'API recherche-entreprises est injoignable.");
  }
  if (!resp.ok) {
    throw httpError(503, 'API_ERROR', `L'API recherche-entreprises a repondu ${resp.status}.`);
  }
  return resp.json();
}

// Retire les parentheses et normalise les espaces d'un nom.
function cleanName(s) {
  return String(s || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Construit l'objet entreprise interne a partir d'un resultat de l'API.
function buildEntreprise(result, etablissement) {
  const etab = etablissement || result.siege || {};
  const naf = normalizeNaf(etab.activite_principale || result.activite_principale);
  const section = result.section_activite_principale || '';
  const desc = describeNaf(naf, section);
  // Determination de la marque recherchable.
  // Personne physique : nom_complet = "PRENOM NOM (enseigne)", la marque est
  // l'enseigne ou le contenu entre parentheses, pas le nom de la personne.
  // Societe : la raison sociale est la marque, sauf enseigne courte disponible.
  const rawNomComplet = result.nom_complet || '';
  const raisonSociale = cleanName(result.nom_raison_sociale);
  const isPersonnePhysique = !raisonSociale;
  const enseigneApi = cleanName(
    (etab.liste_enseignes && etab.liste_enseignes[0]) || etab.enseigne_1 || '',
  );
  const parenthetical = ((rawNomComplet.match(/\(([^)]+)\)/) || [])[1] || '')
    .replace(/\s+/g, ' ')
    .trim();
  const nomCompletClean = cleanName(rawNomComplet);

  let brand;
  if (isPersonnePhysique) {
    brand = enseigneApi || parenthetical || nomCompletClean;
  } else {
    brand =
      enseigneApi && enseigneApi.length <= 25
        ? enseigneApi
        : raisonSociale || nomCompletClean;
  }
  brand = brand || nomCompletClean || 'Entreprise';

  const nom = brand;
  const enseigne = brand;
  const queryNom = brand;
  const etat = (etab.etat_administratif || result.etat_administratif) === 'A' ? 'actif' : 'radie';
  return {
    siret: etab.siret || '',
    siren: result.siren || '',
    nom,
    enseigne,
    queryNom,
    adresse: etab.adresse || '',
    codePostal: etab.code_postal || '',
    ville: etab.libelle_commune || '',
    naf,
    nafLibelle: desc.libelle,
    metier: desc.metier,
    categorie: desc.categorie,
    etat,
  };
}

async function fetchBySiret(siret) {
  const data = await fetchApi(siret);
  const results = data.results || [];
  for (const result of results) {
    // L'API renvoie les etablissements correspondant a la recherche.
    const match = (result.matching_etablissements || []).find((e) => e.siret === siret);
    if (match) return buildEntreprise(result, match);
    if (result.siege && result.siege.siret === siret) return buildEntreprise(result, result.siege);
  }
  throw httpError(404, 'NOT_FOUND', `Aucune entreprise trouvee pour le SIRET ${siret}.`);
}

async function fetchByName(nom, ville) {
  const data = await fetchApi(`${nom} ${ville}`);
  const results = data.results || [];
  if (results.length === 0) {
    throw httpError(404, 'NOT_FOUND', `Aucune entreprise trouvee pour "${nom}" a ${ville}.`);
  }
  const villeLc = ville.toLowerCase().trim();
  // On privilegie un etablissement dans la commune demandee.
  for (const result of results) {
    const etabs = [result.siege, ...(result.matching_etablissements || [])].filter(Boolean);
    const inVille = etabs.find(
      (e) => e.libelle_commune && e.libelle_commune.toLowerCase().includes(villeLc),
    );
    if (inVille) return buildEntreprise(result, inVille);
  }
  // A defaut, le premier resultat et son siege.
  return buildEntreprise(results[0], results[0].siege);
}

export async function resolveEntreprise({ siret, nom, ville }) {
  if (siret) {
    const clean = String(siret).replace(/\s/g, '');
    if (!/^\d{14}$/.test(clean)) {
      throw httpError(400, 'SIRET_INVALID', 'Le SIRET doit contenir exactement 14 chiffres.');
    }
    if (!validateSiret(clean)) {
      throw httpError(400, 'SIRET_INVALID', 'SIRET invalide : cle de controle incorrecte.');
    }
    return fetchBySiret(clean);
  }
  if (nom && ville) {
    return fetchByName(String(nom).trim(), String(ville).trim());
  }
  throw httpError(
    400,
    'INPUT_MISSING',
    "Fournir un SIRET, ou un nom d'enseigne avec une ville.",
  );
}
