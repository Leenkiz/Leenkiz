import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // host: true exposes the dev server on the local network, so the app can
    // be tested from a phone on the same Wi-Fi (PRD §6, README).
    host: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
