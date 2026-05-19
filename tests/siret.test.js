import test from 'node:test';
import assert from 'node:assert/strict';
import { luhn, validateSiret, resolveEntreprise } from '../server/services/siret.js';

// Genere un SIRET valide au sens de Luhn a partir de 13 chiffres.
function makeValidSiret(prefix13) {
  for (let check = 0; check <= 9; check++) {
    const candidate = prefix13 + String(check);
    if (luhn(candidate)) return candidate;
  }
  throw new Error('Impossible de generer un SIRET valide.');
}

test('SIRET valide : la cle de controle Luhn est acceptee', () => {
  const valide = makeValidSiret('3302129170001');
  assert.equal(valide.length, 14);
  assert.equal(validateSiret(valide), true);
});

test('SIRET valide : les espaces sont tolerees', () => {
  const valide = makeValidSiret('7325409870002');
  const espace = `${valide.slice(0, 9)} ${valide.slice(9)}`;
  assert.equal(validateSiret(espace), true);
});

test('SIRET invalide : mauvaise longueur', () => {
  assert.equal(validateSiret('123'), false);
  assert.equal(validateSiret('123456789012345'), false);
});

test('SIRET invalide : cle de controle incorrecte', () => {
  const valide = makeValidSiret('3302129170001');
  const dernier = Number(valide[13]);
  const faux = valide.slice(0, 13) + String((dernier + 1) % 10);
  assert.equal(validateSiret(faux), false);
});

test('resolveEntreprise rejette un SIRET invalide sans appel reseau', async () => {
  await assert.rejects(
    () => resolveEntreprise({ siret: '00000000000001' }),
    (err) => err.code === 'SIRET_INVALID' && err.status === 400,
  );
});

test('resolveEntreprise rejette une saisie vide', async () => {
  await assert.rejects(
    () => resolveEntreprise({}),
    (err) => err.code === 'INPUT_MISSING',
  );
});
