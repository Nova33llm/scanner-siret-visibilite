// Utilitaires de comparaison de texte tolerants aux accents et a la casse.

// Plage des marques diacritiques combinantes (U+0300 a U+036F).
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

export function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Verifie qu'un texte contient le nom recherche.
// On exige la presence des mots significatifs (longueur 3 et plus).
export function textMentions(text, name) {
  const haystack = normalize(text);
  const words = normalize(name)
    .split(' ')
    .filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  const hits = words.filter((w) => haystack.includes(w)).length;
  return hits / words.length >= 0.6;
}

// Retire les accents en conservant la casse et la ponctuation.
export function stripAccents(str) {
  return String(str || '').normalize('NFD').replace(DIACRITICS, '');
}

// Extrait le domaine d'une URL.
export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
