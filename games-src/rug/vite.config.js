import { defineConfig } from "vite";

// RE: the original build used relative asset URLs ("./assets/...", "./loader.js", "../api/scores"),
// so it can be hosted under any sub-path. `base: "./"` reproduces that.
// Target must support top-level await (main.js uses it, as did the original bundle).
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    outDir: "dist",
    // three.js is ~700 kB and rarely changes: its own long-cached chunk, loaded in parallel with the game code
    rollupOptions: {
      output: { manualChunks: (id) => (id.includes("node_modules/three/") ? "three" : undefined) },
    },
    chunkSizeWarningLimit: 750,
  },
});
