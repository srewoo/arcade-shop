import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createTrack, laneSpeed, spacingAt, type TrackRow } from '../src/track';

const rowsFor = (seed: number, n: number): TrackRow[] => {
  const t = createTrack(seed);
  return Array.from({ length: n }, () => t.next());
};

describe('track generation (level validation)', () => {
  it('is deterministic per seed and differs across seeds', () => {
    expect(rowsFor(5, 80)).toEqual(rowsFor(5, 80));
    expect(rowsFor(5, 80)).not.toEqual(rowsFor(6, 80));
  });
  it('never blocks the path lane, and the path drifts at most one lane per row', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rows = rowsFor(seed, 300);
      rows.forEach((row, i) => {
        expect(row.cars.some((c) => c.lane === row.path)).toBe(false);
        if (i > 0) expect(Math.abs(row.path - (rows[i - 1]?.path ?? row.path))).toBeLessThanOrEqual(1);
      });
    }
  });
  it('keeps every row passable: at most 3 cars, one per lane, lanes in range', () => {
    for (const row of rowsFor(9, 400)) {
      expect(row.cars.length).toBeGreaterThanOrEqual(1);
      expect(row.cars.length).toBeLessThanOrEqual(CONFIG.traffic.maxCarsPerRow);
      const lanes = row.cars.map((c) => c.lane);
      expect(new Set(lanes).size).toBe(lanes.length);
      lanes.forEach((l) => expect(l >= 0 && l < CONFIG.lanes).toBe(true));
    }
  });
  it('rows are strictly ordered and spacing tightens with distance', () => {
    const rows = rowsFor(3, 200);
    rows.forEach((r, i) => i > 0 && expect(r.z).toBeGreaterThan(rows[i - 1]?.z ?? 0));
    expect(spacingAt(CONFIG.traffic.rampDist)).toBeLessThan(spacingAt(0));
    expect(spacingAt(1e9)).toBe(CONFIG.traffic.spacingEnd);
  });
  it('fuel pickups appear regularly so a tank can be sustained', () => {
    const rows = rowsFor(11, 300);
    const fuels = rows.flatMap((r) => r.pickups).filter((p) => p.kind === 'fuel');
    const span = (rows.at(-1)?.z ?? 0) - CONFIG.traffic.firstRowZ;
    expect(fuels.length).toBeGreaterThan(span / (CONFIG.traffic.fuelEvery * 1.3));
    fuels.forEach((p) => expect(p.lane >= 0 && p.lane < CONFIG.lanes).toBe(true));
  });
  it('lane speeds are above the player minimum so cars never trail the slowest player', () => {
    for (let l = 0; l < CONFIG.lanes; l++) expect(laneSpeed(l)).toBeGreaterThan(CONFIG.player.minSpeed);
  });
});
