import { describe, it, expect } from "vitest";
import { AI_PROFILES, AI_FINISHED_PROFILE, AI_DRIVING, DIFFICULTY } from "../src/config/ai.js";
import { scaleProfile, buildOpponentProfiles } from "../src/logic/difficulty.js";
import { TIERS, tierForDuration } from "../src/logic/drift.js";
import { gapSeconds } from "../src/logic/gaps.js";
import { HUD_TUNING } from "../src/config/hud.js";

// These numbers decide the six original maps' bit-identical sim() times: a change here must be deliberate.
describe("tuning moved to config keeps its values", () => {
  it("AI profiles are the original ones", () => {
    expect(AI_PROFILES.slice(0, 3)).toEqual([{ top: 36.2, aLat: 88 }, { top: 35.2, aLat: 82 }, { top: 34.2, aLat: 76 }]);
    expect(AI_FINISHED_PROFILE).toEqual({ top: 24, aLat: 70 });
  });
  it("driver constants are the original literals", () => {
    expect(AI_DRIVING).toMatchObject({
      lookaheadBase: 7, lookaheadPerSpeed: 0.36, laneLimit: 5.6, steerGain: 3.4, laneFollow: 2.4,
      rubberGain: 0.0022, rubberMin: -0.07, rubberMax: 0.08, topOverrideScale: 1.1, coastThrottle: 0.15,
      brakeMargin: 2, brakeAmount: 0.7, stuckSeconds: 1.4, stuckSkip: 8,
    });
  });
  it("Normal difficulty multiplies by exactly 1 (identity, bit for bit)", () => {
    for (const p of AI_PROFILES) {
      const scaled = scaleProfile(p, "normal");
      expect(Object.is(scaled.top, p.top)).toBe(true);
      expect(Object.is(scaled.aLat, p.aLat)).toBe(true);
      expect(scaled.rubber).toBe(1);
    }
    expect(DIFFICULTY.normal).toMatchObject({ top: 1, aLat: 1, rubber: 1 });
  });
  it("harder levels are strictly faster and easier ones slower", () => {
    const order = ["easy", "normal", "hard", "insane"].map((d) => scaleProfile(AI_PROFILES[0], d).top);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(new Set(order).size).toBe(4);
    expect(buildOpponentProfiles(AI_PROFILES, 9, "normal")).toHaveLength(5);
  });
  it("drift tiers keep their thresholds and gain readable names", () => {
    expect(TIERS.map((t) => t.minT)).toEqual([0, 1, 2]);
    expect(TIERS.map((t) => t.short)).toEqual(["", "MINI", "SUPER"]);
    expect(tierForDuration(1.5)).toBe(1);
  });
  it("gap estimate floors the speed at the configured value", () => {
    expect(HUD_TUNING.gapSpeedFloor).toBe(12);
    expect(gapSeconds(24, 0)).toBe(2);
    expect(gapSeconds(24, 48)).toBe(0.5);
  });
});
