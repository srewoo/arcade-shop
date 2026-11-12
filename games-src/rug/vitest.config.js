import { defineConfig } from "vitest/config";

// Unit tests cover the pure logic modules in src/logic (no three, no DOM).
export default defineConfig({
  test: { include: ["tests/**/*.test.js"], environment: "node" },
});
