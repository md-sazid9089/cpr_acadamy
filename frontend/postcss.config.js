import { fileURLToPath, URL } from 'node:url';

// Tailwind is pointed at an absolute config path rather than left to search
// upward from process.cwd(). A build launched from the repo root otherwise
// finds no tailwind.config.js, loses every custom token, and fails on the first
// `@apply dark:bg-surface-dark`.
export default {
  plugins: {
    tailwindcss: {
      config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
    },
    autoprefixer: {},
  },
};
