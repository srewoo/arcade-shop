import { describe, it, expect } from "vitest";
import {
  checkpointProgs, lapTimes, fastestLap, bestTimeAtProgress, liveDelta, formatDelta, SplitTracker, SECTORS_PER_LAP,
} from "../src/logic/splits.js";
import { mergeRun, validateBest, bestKey, ghostKey, loadBest, saveBest, validMapId } from "../src/logic/bests.js";

describe("checkpoints", () => {
  it("places 3 per lap, the last at the finish line", () => {
    expect(SECTORS_PER_LAP).toBe(3);
    expect(checkpointProgs(1, 300)).toEqual([100, 200, 300]);
    const five = checkpointProgs(5, 300);
    expect(five).toHaveLength(15);
    expect(five[14]).toBe(1500);
    expect(five[3]).toBe(400);
  });
  it("derives lap times and the fastest lap", () => {
    const laps = lapTimes([10, 21, 33, 44, 55, 65], 2);
    expect(laps).toEqual([33, 32]);
    expect(fastestLap(laps)).toBe(32);
    expect(fastestLap([])).toBeNull();
    expect(lapTimes([10, 20], 1)).toEqual([]); // incomplete lap
  });
});

describe("interpolated best time / live delta", () => {
  const cps = checkpointProgs(1, 300);
  const best = [10, 21, 30];
  it("interpolates linearly between checkpoints", () => {
    expect(bestTimeAtProgress(best, cps, 0)).toBe(0);
    expect(bestTimeAtProgress(best, cps, 50)).toBeCloseTo(5);
    expect(bestTimeAtProgress(best, cps, 100)).toBeCloseTo(10);
    expect(bestTimeAtProgress(best, cps, 150)).toBeCloseTo(15.5);
    expect(bestTimeAtProgress(best, cps, 300)).toBeCloseTo(30);
    expect(bestTimeAtProgress(best, cps, 999)).toBe(30);
  });
  it("is null without a usable best", () => {
    expect(bestTimeAtProgress(null, cps, 50)).toBeNull();
    expect(bestTimeAtProgress([1, 2], cps, 50)).toBeNull();
    expect(liveDelta(null, cps, 50, 5)).toBeNull();
  });
  it("is negative when ahead of the best run and positive when behind", () => {
    expect(liveDelta(best, cps, 100, 9.5)).toBeCloseTo(-0.5);
    expect(liveDelta(best, cps, 100, 10.75)).toBeCloseTo(0.75);
    expect(liveDelta(best, cps, 200, 21)).toBeCloseTo(0);
  });
  it("formats signed deltas", () => {
    expect(formatDelta(0.344)).toBe("+0.34");
    expect(formatDelta(-0.215)).toBe("-0.21");
    expect(formatDelta(0)).toBe("+0.00");
  });
});

describe("SplitTracker", () => {
  it("emits one event per checkpoint with lap/sector numbers and deltas vs best", () => {
    const t = new SplitTracker(2, 300, [10, 20, 30, 40, 50, 60]);
    expect(t.update(50, 4)).toEqual([]);
    const a = t.update(101, 10.5);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ index: 0, lap: 1, sector: 1, delta: 0.5, lapEnd: false });
    const b = t.update(310, 31); // crosses two checkpoints in one call (index 1 and 2)
    expect(b.map((e) => [e.lap, e.sector, e.lapEnd])).toEqual([[1, 2, false], [1, 3, true]]);
    expect(b[1].delta).toBeCloseTo(1);
    const c = t.update(400, 40);
    expect(c[0]).toMatchObject({ lap: 2, sector: 1 });
  });
  it("reports null deltas without a best and ignores progress moving backwards", () => {
    const t = new SplitTracker(1, 300);
    expect(t.update(120, 12)[0].delta).toBeNull();
    expect(t.update(50, 13)).toEqual([]);
    expect(t.times).toHaveLength(1);
    expect(t.delta(13)).toBeNull();
  });
  it("finishes after the last checkpoint and ignores a mismatching best", () => {
    const t = new SplitTracker(1, 300, [1, 2]);
    expect(t.best).toBeNull();
    t.update(300, 30);
    expect(t.done).toBe(true);
    expect(t.update(900, 99)).toEqual([]);
  });
  it("live delta uses the furthest progress", () => {
    const t = new SplitTracker(1, 300, [10, 20, 30]);
    t.update(150, 14);
    expect(t.delta(14)).toBeCloseTo(14 - 15);
  });
});

describe("best records", () => {
  const run = { ms: 30000, splits: [10000, 20000, 30000], bestLap: 30000 };
  it("validates shape, monotonic splits and lap-count match", () => {
    expect(validateBest({ v: 1, ...run }, 1)).not.toBeNull();
    expect(validateBest({ v: 1, ...run }, 3)).toBeNull();
    expect(validateBest({ v: 2, ...run }, 1)).toBeNull();
    expect(validateBest({ v: 1, ...run, splits: [10000, 5000, 30000] }, 1)).toBeNull();
    expect(validateBest({ v: 1, ...run, ms: 29999 }, 1)).toBeNull();
    expect(validateBest({ v: 1, ...run, bestLap: -1 }, 1)).toBeNull();
    expect(validateBest({ v: 1, ...run, ms: 1.5 }, 1)).toBeNull();
    expect(validateBest(null, 1)).toBeNull();
  });
  it("keeps the faster run and tracks best lap independently", () => {
    const first = mergeRun(null, run);
    expect(first).toMatchObject({ newBest: true, newBestLap: true });
    const slowerButFastLap = { ms: 31000, splits: [9000, 20000, 31000], bestLap: 29000 };
    const merged = mergeRun(first.record, slowerButFastLap);
    expect(merged.newBest).toBe(false);
    expect(merged.newBestLap).toBe(true);
    expect(merged.record.ms).toBe(30000);
    expect(merged.record.splits).toEqual(run.splits);
    expect(merged.record.bestLap).toBe(29000);
    const faster = mergeRun(merged.record, { ms: 28000, splits: [9000, 18000, 28000], bestLap: 28000 });
    expect(faster.record.ms).toBe(28000);
    expect(faster.newBest).toBe(true);
  });
  it("keys separate mode, map and lap count; rejects odd map ids", () => {
    expect(bestKey("tt", "sol", 3)).not.toBe(bestKey("race", "sol", 3));
    expect(bestKey("tt", "sol", 3)).not.toBe(bestKey("tt", "sol", 5));
    expect(ghostKey("sol", 3)).toContain("sol");
    expect(validMapId("claude-bend")).toBe(true);
    expect(validMapId("../x")).toBe(false);
  });
  it("loads valid records and removes corrupt ones", () => {
    const data = {};
    const storage = { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
    const key = bestKey("tt", "sol", 1);
    expect(saveBest(storage, key, mergeRun(null, run).record)).toBe(true);
    expect(loadBest(storage, key, 1).ms).toBe(30000);
    data[key] = "{oops";
    expect(loadBest(storage, key, 1)).toBeNull();
    data[key] = JSON.stringify({ v: 1, ms: 5 });
    expect(loadBest(storage, key, 1)).toBeNull();
    expect(key in data).toBe(false);
    expect(loadBest(null, key, 1)).toBeNull();
  });
});
