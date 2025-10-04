import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the devilsdebate front‑end. This config
// enables the React plugin and specifies that the development server
// should run on port 5173 (the default). Adjust the base path if you
// deploy the built assets to a sub‑directory.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});