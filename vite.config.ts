import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite + React + Tailwind v4 (CSS-first). The static marketing site lives in
// legacy/ during the port; api/ holds the Vercel serverless function.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
