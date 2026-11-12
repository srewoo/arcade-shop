import { describe, it, expect } from "vitest";
import { DIFFICULTY, scaleProfile, buildOpponentProfiles, MAX_OPPONENTS } from "../src/logic/difficulty.js";

const BASE = [
  { top: 36.2, aLat: 88 },
  { top: 35.2, aLat: 82 },
  { top: 34.2, aLat: 76 },
  { top: 33.2, aLat: 70 },
  { top: 32.2, aLat: 64 },
];

describe("scaleProfile", () => {
  it("normal is bit-identical to the original profile", () => {
    for (const p of BASE) {
      const s = scaleProfile(p, "normal");
      expect(Object.is(s.top, p.top)).toBe(true);
      expect(Object.is(s.aLat, p.aLat)).toBe(true);
      expect(s.rubber).toBe(1);
    }
  });
  it("is strictly monotonic easy < normal < hard < insane", () => {
    const order = ["easy", "normal", "hard", "insane"].map((d) => scaleProfile(BASE[0], d));
    for (let i = 1; i < order.length; i++) {
      expect(order[i].top).toBeGreaterThan(order[i - 1].top);
      expect(order[i].aLat).toBeGreaterThan(order[i - 1].aLat);
      expect(order[i].rubber).toBeGreaterThan(order[i - 1].rubber);
    }
  });
  it("scales by the table factors and does not mutate the input", () => {
    const p = { top: 40, aLat: 100 };
    const s = scaleProfile(p, "hard");
    expect(s.top).toBeCloseTo(40 * DIFFICULTY.hard.top);
    expect(s.aLat).toBeCloseTo(100 * DIFFICULTY.hard.aLat);
    expect(p).toEqual({ top: 40, aLat: 100 });
  });
  it("treats unknown difficulties as normal", () => {
    expect(scaleProfile(BASE[1], "nope")).toEqual(scaleProfile(BASE[1], "normal"));
  });
});

describe("buildOpponentProfiles", () => {
  it("returns one profile per opponent in base order", () => {
    expect(buildOpponentProfiles(BASE, 0, "normal")).toEqual([]);
    const three = buildOpponentProfiles(BASE, 3, "normal");
    expect(three.map((p) => p.top)).toEqual([36.2, 35.2, 34.2]);
    expect(buildOpponentProfiles(BASE, 5, "hard")).toHaveLength(5);
  });
  it("clamps the count to 0..5 and the available profiles", () => {
    expect(MAX_OPPONENTS).toBe(5);
    expect(buildOpponentProfiles(BASE, 99, "normal")).toHaveLength(5);
    expect(buildOpponentProfiles(BASE, -2, "normal")).toHaveLength(0);
    expect(buildOpponentProfiles(BASE, NaN, "normal")).toHaveLength(0);
    expect(buildOpponentProfiles(BASE.slice(0, 3), 5, "normal")).toHaveLength(3);
  });
});
