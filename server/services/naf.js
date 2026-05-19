import { NAF, SECTIONS } from './naf-data.js';

// Mapping code NAF (APE) vers categorie metier, libelle et terme de recherche.

const RESTO = ['56.10A', '56.10B', '56.10C', '56.21Z', '56.30Z'];
const COIFFURE = ['96.02A'];
const BEAUTE = ['96.02B', '96.04Z'];

// Normalise un code NAF vers le format XX.XXY (ex: "5610A" -> "56.10A").
export function normalizeNaf(raw) {
  if (!raw) return '';
  const clean = String(raw).toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (clean.length >= 5) {
    return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  }
  return String(raw).toUpperCase();
}

export function categorieFromNaf(naf) {
  const code = normalizeNaf(naf);
  if (RESTO.includes(code)) return 'resto';
  if (COIFFURE.includes(code) || BEAUTE.includes(code)) return 'beaute';
  return 'autre';
}

// Libelle lisible du code NAF, avec repli sur la section.
export function nafLibelle(naf, section) {
  const code = normalizeNaf(naf);
  if (NAF[code]) return NAF[code][0];
  if (section && SECTIONS[section]) return SECTIONS[section][0];
  return code || 'Activite non precisee';
}

// Terme employe pour la requete "metier + ville".
export function metierFromNaf(naf, section) {
  const code = normalizeNaf(naf);
  if (NAF[code]) return NAF[code][1];
  if (section && SECTIONS[section]) return SECTIONS[section][1];
  return 'entreprise';
}

// Description complete utilisee a la resolution de l'entreprise.
export function describeNaf(naf, section) {
  return {
    categorie: categorieFromNaf(naf),
    libelle: nafLibelle(naf, section),
    metier: metierFromNaf(naf, section),
  };
}
