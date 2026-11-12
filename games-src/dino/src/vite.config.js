import { defineConfig } from 'vite';

// Relative base: the original is served from a sub-path and calls ../api/scores.
// three and Rapier get their own chunks; Rapier (with its inlined WASM) is also loaded with a dynamic import() after first paint.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
    chunkSizeWarningLimit: 4500, // the lazy rapier chunk is mostly inlined WASM; the first-paint chunks are about 670 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@dimforge/rapier3d-compat')) return 'rapier';
          return undefined;
        },
      },
    },
  },
});
