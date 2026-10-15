import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The front runs on its own port; /api and /img go to the app's own API (server/index.ts)
const api = `http://127.0.0.1:${process.env.ARMA_PORT || 3002}`;

export default defineConfig({
  plugins: [react()],
  server: {
    // ARMA_WEB_PORT / ARMA_PORT (the API's): a second copy side by side (tests on a copy of the database)
    port: Number(process.env.ARMA_WEB_PORT || 5180),
    strictPort: true,
    proxy: { '/api': api, '/img': api },
  },
});
