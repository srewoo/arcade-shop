import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The launcher pages (popup + full arcade tab). Games are built separately into dist/games by scripts/build-games.mjs.
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: { popup: resolve(__dirname, 'src/popup.html'), arcade: resolve(__dirname, 'src/arcade.html') },
    },
  },
});
