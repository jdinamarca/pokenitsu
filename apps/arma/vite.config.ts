import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The front runs on its own port; /api and /img go to the app's own API (server/index.ts)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3002', '/img': 'http://127.0.0.1:3002' },
  },
});
