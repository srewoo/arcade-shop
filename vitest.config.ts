import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts, whose root is src/ (the launcher pages). games-src/ has its own per-game suites.
export default defineConfig({
  test: { root: __dirname, include: ['tests/**/*.test.ts'], exclude: ['games-src/**', 'node_modules/**'], environment: 'node' },
});
