import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le client React est servi par Vite en dev, l'API Express tourne sur le port 3001.
// Les appels /api sont relayes vers Express via le proxy ci-dessous.
export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    // strictPort : si 5173 est deja pris (instance zombie), Vite echoue
    // clairement au lieu de basculer en silence sur un autre port.
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
