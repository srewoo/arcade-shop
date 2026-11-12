import { describe, it, expect } from "vitest";
import {
  DriftScorer, tierForDuration, driftPointRate, sparkColor, turboImpulse, turboThrust, TIERS, COMBO_WINDOW, MIN_DRIFT_TIME,
} from "../src/logic/drift.js";

const DT = 1 / 60;
function run(scorer, seconds, input, events = []) {
  for (let t = 0; t < seconds - 1e-9; t += DT) events.push(...scorer.update(DT, input));
  return events;
}
const DRIFT = { drifting: true, speed: 37 };
const COAST = { drifting: false, speed: 37 };

describe("tiers", () => {
  it("map duration to tiers at 1 s and 2 s", () => {
    expect(tierForDuration(0)).toBe(0);
    expect(tierForDuration(0.99)).toBe(0);
    expect(tierForDuration(1)).toBe(1);
    expect(tierForDuration(1.99)).toBe(1);
    expect(tierForDuration(2)).toBe(2);
    expect(tierForDuration(10)).toBe(2);
  });
  it("spark colour changes with tier", () => {
    expect(new Set([sparkColor(0.1), sparkColor(1.2), sparkColor(2.5)]).size).toBe(3);
    expect(sparkColor(1.2)).toBe(TIERS[1].color);
  });
  it("turbo impulse/thrust are capped at the top speed and never negative", () => {
    expect(turboImpulse(0, 30, 54)).toBe(0);
    expect(turboImpulse(1, 30, 54)).toBe(TIERS[1].impulse);
    expect(turboImpulse(2, 50, 54)).toBe(4);
    expect(turboImpulse(2, 60, 54)).toBe(0);
    expect(turboThrust(2, 0.01, 40, 54)).toBeCloseTo(TIERS[2].thrust * 0.01);
    expect(turboThrust(1, 1, 53, 54)).toBe(1);
    expect(turboThrust(1, 0.01, 54, 54)).toBe(0);
    expect(turboThrust(9, 1, 0, 54)).toBe(0);
  });
  it("tier 2 is a stronger burst than tier 1", () => {
    expect(TIERS[2].impulse).toBeGreaterThan(TIERS[1].impulse);
    expect(TIERS[2].dur).toBeGreaterThan(TIERS[1].dur);
  });
});

describe("driftPointRate", () => {
  it("grows with speed and with duration, and is zero when stopped", () => {
    expect(driftPointRate(37, 0)).toBeCloseTo(60);
    expect(driftPointRate(37, 2)).toBeGreaterThan(driftPointRate(37, 1));
    expect(driftPointRate(37, 1)).toBeGreaterThan(driftPointRate(37, 0));
    expect(driftPointRate(30, 1)).toBeLessThan(driftPointRate(40, 1));
    expect(driftPointRate(0, 5)).toBe(0);
    expect(driftPointRate(-5, 5)).toBe(0);
  });
});

describe("DriftScorer", () => {
  it("longer drifts score disproportionately more", () => {
    const a = new DriftScorer();
    run(a, 1, DRIFT);
    const b = new DriftScorer();
    run(b, 2, DRIFT);
    expect(b.pending).toBeGreaterThan(a.pending * 2);
  });
  it("faster drifts score more", () => {
    const slow = new DriftScorer();
    run(slow, 1, { drifting: true, speed: 20 });
    const fast = new DriftScorer();
    run(fast, 1, { drifting: true, speed: 40 });
    expect(fast.pending).toBeGreaterThan(slow.pending);
  });
  it("emits tier events while drifting and a release tier on letting go", () => {
    const s = new DriftScorer();
    const ev = run(s, 2.2, DRIFT);
    expect(ev.filter((e) => e.type === "tier").map((e) => e.tier)).toEqual([1, 2]);
    const rel = run(s, 0.1, COAST).find((e) => e.type === "release");
    expect(rel.tier).toBe(2);
    expect(rel.duration).toBeGreaterThan(2.1);
    expect(rel.points).toBeGreaterThan(0);
  });
  it("gives tier 1 for a ~1.3 s drift and tier 0 for a short one", () => {
    const s = new DriftScorer();
    run(s, 1.3, DRIFT);
    expect(run(s, 0.1, COAST).find((e) => e.type === "release").tier).toBe(1);
    const q = new DriftScorer();
    run(q, 0.6, DRIFT);
    expect(run(q, 0.1, COAST).find((e) => e.type === "release").tier).toBe(0);
  });
  it("ignores slides shorter than the minimum", () => {
    const s = new DriftScorer();
    run(s, MIN_DRIFT_TIME * 0.5, DRIFT);
    expect(run(s, 0.1, COAST).some((e) => e.type === "release")).toBe(false);
  });
  it("banks the points after the combo window", () => {
    const s = new DriftScorer();
    run(s, 1, DRIFT);
    const pending = Math.round(s.pending);
    const ev = run(s, COMBO_WINDOW + 0.2, COAST);
    const bank = ev.find((e) => e.type === "bank");
    expect(bank.points).toBe(pending);
    expect(s.total).toBe(pending);
    expect(s.pending).toBe(0);
  });
  it("chains drifts into a combo with a growing multiplier", () => {
    const s = new DriftScorer();
    run(s, 1, DRIFT);
    const first = s.pending;
    run(s, 0.5, COAST);
    run(s, 1, DRIFT);
    expect(s.combo).toBe(2);
    expect(s.pending - first).toBeGreaterThan(first * 1.2); // second drift is worth x1.5
  });
  it("loses unbanked points on a hit, during or after a drift", () => {
    const s = new DriftScorer();
    run(s, 1.5, DRIFT);
    const lost = s.hit();
    expect(lost.type).toBe("lost");
    expect(lost.points).toBeGreaterThan(0);
    expect(s.pending).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.tier).toBe(0);
    run(s, COMBO_WINDOW + 1, COAST);
    expect(s.total).toBe(0);
    const t = new DriftScorer();
    run(t, 1, DRIFT);
    run(t, 0.3, COAST);
    expect(t.hit().type).toBe("lost");
  });
  it("keeps points that were already banked when hit later", () => {
    const s = new DriftScorer();
    run(s, 1, DRIFT);
    run(s, COMBO_WINDOW + 0.2, COAST);
    const total = s.total;
    expect(total).toBeGreaterThan(0);
    expect(s.hit()).toBeNull();
    expect(s.total).toBe(total);
  });
  it("a hit mid-drift restarts the drift timer so the tier is lost", () => {
    const s = new DriftScorer();
    run(s, 1.5, DRIFT);
    s.hit();
    expect(run(s, 0.1, COAST).find((e) => e.type === "release")?.tier ?? 0).toBe(0);
  });
});
