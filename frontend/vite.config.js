import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolved from this file, not from process.cwd(): CI and Vercel invoke
      // the build from whichever directory they please, and a cwd-relative
      // alias silently resolves to the wrong place when they do.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    // Same reasoning as the alias: pin PostCSS to this directory so the config
    // is found regardless of where the build was launched from.
    postcss: fileURLToPath(new URL('.', import.meta.url)),
  },
  server: {
    port: 5173,
    open: true,
  },
});
