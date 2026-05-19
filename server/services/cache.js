import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cache fichier simple. Evite de surcharger les sources pendant les tests repetes.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

function load() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
}

export function getCache(key) {
  const data = load();
  const entry = data[key];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete data[key];
    save(data);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttl = DEFAULT_TTL) {
  const data = load();
  data[key] = { value, expires: Date.now() + ttl };
  save(data);
}
