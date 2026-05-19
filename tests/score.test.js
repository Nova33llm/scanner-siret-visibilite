import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../server/services/score.js';

// Jeu de donnees de reference : entreprise bien referencee.
function baseInputs() {
  return {
    google: { status: 'ok', presentNom: true, presentMetierVille: true },
    googleBusiness: { status: 'ok', found: true, note: 4.6, avis: 80 },
    website: {
      status: 'ok',
      found: true,
      quality: { https: true, viewport: true, title: true, description: true, h1: true },
      qualityScore: 15,
    },
    directories: {
      status: 'ok',
      items: [
        { name: 'Pages Jaunes', found: true, status: 'ok' },
        { name: 'Yelp', found: true, status: 'ok' },
      ],
    },
  };
}

function categorie(score, nom) {
  return score.breakdown.find((c) => c.categorie === nom);
}

test('entreprise bien referencee : score eleve', () => {
  const score = computeScore(baseInputs());
  assert.ok(score.total >= 80, `score attendu eleve, obtenu ${score.total}`);
  assert.equal(score.note, 'A');
  assert.equal(score.reweighted, false);
});

test('entreprise sans site web : categorie site a 0', () => {
  const inputs = baseInputs();
  inputs.website = { status: 'ok', found: false, quality: null, qualityScore: 0 };
  const score = computeScore(inputs);
  const site = categorie(score, 'Site web');
  assert.equal(site.points, 0);
  assert.equal(site.status, 'ok');
  assert.ok(score.total < 100);
});

test('entreprise sans fiche Google Business : categorie GBP a 0', () => {
  const inputs = baseInputs();
  inputs.googleBusiness = { status: 'ok', found: false, note: null, avis: null };
  const score = computeScore(inputs);
  const gbp = categorie(score, 'Fiche etablissement et avis');
  assert.equal(gbp.points, 0);
  assert.equal(gbp.status, 'ok');
});

test('source bloquee : categorie exclue et score reponere', () => {
  const inputs = baseInputs();
  inputs.googleBusiness = { status: 'blocked' };
  const score = computeScore(inputs);
  const gbp = categorie(score, 'Fiche etablissement et avis');
  assert.equal(gbp.status, 'indetermine');
  assert.equal(score.reweighted, true);
  // Les trois autres categories sont au maximum, le score reste a 100.
  assert.equal(score.total, 100);
});

test('toutes les sources bloquees : score nul', () => {
  const score = computeScore({
    google: { status: 'blocked' },
    googleBusiness: { status: 'blocked' },
    website: { status: 'ok', found: false, qualityScore: 0 },
    directories: { status: 'blocked' },
  });
  // Seule la categorie site reste analysable, ici sans site donc 0.
  assert.equal(score.total, 0);
  assert.equal(score.note, 'E');
});
