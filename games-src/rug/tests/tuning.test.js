import { describe, it, expect } from "vitest";
import { CAR_TUNING, NEUTRAL_TUNE, tuneFor, statBars, barPercent, STAT_KEYS } from "../src/logic/tuning.js";
import { gapSeconds, neighbours, formatGap } from "../src/logic/gaps.js";

describe("car tuning", () => {
  it("defines 4 classic and 4 lego models, all within +-15% of today's values", () => {
    for (const kind of ["classic", "lego"]) {
      expect(CAR_TUNING[kind]).toHaveLength(4);
      for (const m of CAR_TUNING[kind]) for (const k of STAT_KEYS) expect(Math.abs(m[k] - 1)).toBeLessThanOrEqual(0.15);
    }
  });
  it("makes every model a distinct trade-off (no model is better in all stats)", () => {
    const all = [...CAR_TUNING.classic, ...CAR_TUNING.lego];
    const signature = new Set(all.map((m) => STAT_KEYS.map((k) => m[k]).join(",")));
    expect(signature.size).toBe(8);
    for (const a of all) {
      for (const b of all) {
        if (a === b) continue;
        const dominates = STAT_KEYS.every((k) => a[k] >= b[k]) && STAT_KEYS.some((k) => a[k] > b[k]);
        expect(dominates).toBe(false);
      }
    }
  });
  it("tuneFor is neutral for anything invalid and returns copies", () => {
    expect(tuneFor("classic", 0)).toEqual(NEUTRAL_TUNE);
    expect(tuneFor("nope", 0)).toBe(NEUTRAL_TUNE);
    expect(tuneFor("lego", 9)).toBe(NEUTRAL_TUNE);
    const t = tuneFor("lego", 3);
    t.top = 99;
    expect(CAR_TUNING.lego[3].top).not.toBe(99);
  });
  it("bar percentages map 1.0 to the middle and clamp", () => {
    expect(barPercent(1)).toBe(50);
    expect(barPercent(0.5)).toBe(0);
    expect(barPercent(2)).toBe(100);
    const bars = statBars(tuneFor("classic", 3));
    expect(bars.map((b) => b.key)).toEqual(STAT_KEYS);
    expect(bars.find((b) => b.key === "top").delta).toBe(6);
    expect(bars.find((b) => b.key === "grip").delta).toBe(-10);
  });
});

describe("gaps", () => {
  it("converts progress gaps to seconds with a speed floor", () => {
    expect(gapSeconds(37, 37)).toBeCloseTo(1);
    expect(gapSeconds(12, 0)).toBeCloseTo(1);
    expect(gapSeconds(-5, 30)).toBe(0);
  });
  it("finds neighbours in the standings", () => {
    const a = {}, b = {}, c = {};
    expect(neighbours([a, b, c], b)).toEqual({ ahead: a, behind: c });
    expect(neighbours([a, b, c], a)).toEqual({ ahead: null, behind: b });
    expect(neighbours([a, b, c], c)).toEqual({ ahead: b, behind: null });
    expect(neighbours([a], {})).toEqual({ ahead: null, behind: null });
  });
  it("formats signed gaps", () => {
    expect(formatGap(1.24)).toBe("+1.2s");
    expect(formatGap(-0.84)).toBe("-0.8s");
  });
});
