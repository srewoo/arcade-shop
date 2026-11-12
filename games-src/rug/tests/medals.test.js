import { describe, it, expect } from "vitest";
import { parMs, medalFor, medalTargets, medalStars, MEDALS } from "../src/logic/medals.js";
import { MEDAL_MULTIPLIERS, PAR_LAP_SECONDS } from "../src/config/medals.js";

describe("medals", () => {
  const par = 60000;
  it("par scales with laps and rejects bad input", () => {
    expect(parMs(20, 3)).toBe(60000);
    expect(parMs(undefined, 3)).toBeNull();
    expect(parMs(0, 3)).toBeNull();
    expect(parMs(20, 0)).toBeNull();
  });
  it("thresholds are 1.04 / 1.12 / 1.25 of par (inclusive)", () => {
    expect(medalFor(par * 1.04, par)).toBe("gold");
    expect(medalFor(par * 1.04 + 1, par)).toBe("silver");
    expect(medalFor(par * 1.12, par)).toBe("silver");
    expect(medalFor(par * 1.25, par)).toBe("bronze");
    expect(medalFor(par * 1.25 + 1, par)).toBeNull();
    expect(medalFor(par * 0.5, par)).toBe("gold");
  });
  it("no medal without a par or a valid time", () => {
    expect(medalFor(50000, null)).toBeNull();
    expect(medalFor(NaN, par)).toBeNull();
    expect(medalFor(-5, par)).toBeNull();
    expect(medalFor(0, par)).toBeNull();
  });
  it("targets and stars", () => {
    expect(medalTargets(par)).toEqual({ gold: 62400, silver: 67200, bronze: 75000 });
    expect(medalTargets(null)).toBeNull();
    expect(MEDALS.map(medalStars)).toEqual([1, 2, 3]);
    expect(medalStars(null)).toBe(0);
  });
  it("multipliers are ordered and the par table holds sane seconds", () => {
    expect(MEDAL_MULTIPLIERS.gold).toBeLessThan(MEDAL_MULTIPLIERS.silver);
    expect(MEDAL_MULTIPLIERS.silver).toBeLessThan(MEDAL_MULTIPLIERS.bronze);
    for (const [id, sec] of Object.entries(PAR_LAP_SECONDS)) {
      expect(id).toMatch(/^[a-z-]+$/);
      expect(sec).toBeGreaterThan(5);
      expect(sec).toBeLessThan(120);
    }
  });
});
