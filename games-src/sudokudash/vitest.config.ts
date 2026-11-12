import { defineConfig } from 'vitest/config';

// CSS is processed (not blanked) so layout tests can read the real stylesheet text.
export default defineConfig({ test: { css: { include: [/.+/] } } });
