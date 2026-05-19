/*
 * Vous inspectez le code ? Demandez-moi, je vous explique avec plaisir.
 * Emmanuel Truffaut, Product Builder No-Code et IA.
 * LinkedIn : https://www.linkedin.com/in/emmanuel-truffaut-b38b292b7
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runScan } from './scan.js';
import { closeBrowser } from './browser.js';

// Charge le fichier .env s'il existe (cle Google Custom Search optionnelle).
try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env, l'outil fonctionne sans.
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Limite de longueur des champs texte, garde-fou simple contre les abus.
const MAX_LEN = 120;

app.post('/api/scan', async (req, res) => {
  const { siret, nom, ville } = req.body || {};
  if ([siret, nom, ville].some((v) => typeof v === 'string' && v.length > MAX_LEN)) {
    return res.status(400).json({
      error: 'INPUT_TOO_LONG',
      message: `Chaque champ est limite a ${MAX_LEN} caracteres.`,
    });
  }
  try {
    const report = await runScan({ siret, nom, ville });
    res.json(report);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      error: err.code || 'SCAN_ERROR',
      message: err.message || 'Erreur inattendue pendant le scan.',
    });
  }
});

// En production (apres npm run build), le serveur sert aussi le client.
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Ecoute sur la boucle locale uniquement : l'outil n'est pas expose au reseau.
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Scanner SIRET, API sur http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nERREUR : le port ${PORT} est deja utilise (instance precedente non fermee).`,
    );
    console.error('Fermez les anciens process Node, puis relancez : npm run dev\n');
  } else {
    console.error('Erreur serveur :', err.message);
  }
  process.exit(1);
});

async function shutdown() {
  await closeBrowser();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
