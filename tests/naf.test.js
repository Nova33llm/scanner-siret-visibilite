import test from 'node:test';
import assert from 'node:assert/strict';
import { categorieFromNaf, metierFromNaf, normalizeNaf } from '../server/services/naf.js';

test('normalizeNaf insere le point manquant', () => {
  assert.equal(normalizeNaf('5610A'), '56.10A');
  assert.equal(normalizeNaf('56.10A'), '56.10A');
});

test('categorieFromNaf classe la restauration', () => {
  assert.equal(categorieFromNaf('56.10A'), 'resto');
  assert.equal(categorieFromNaf('5610C'), 'resto');
});

test('categorieFromNaf classe la coiffure et la beaute', () => {
  assert.equal(categorieFromNaf('96.02A'), 'beaute');
  assert.equal(categorieFromNaf('96.02B'), 'beaute');
});

test('categorieFromNaf renvoie autre par defaut', () => {
  assert.equal(categorieFromNaf('47.11F'), 'autre');
});

test('metierFromNaf renvoie un libelle de recherche', () => {
  assert.equal(metierFromNaf('56.10A'), 'restaurant');
  assert.equal(metierFromNaf('96.02A'), 'coiffeur');
});
