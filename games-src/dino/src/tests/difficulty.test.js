import { describe, it, expect } from 'vitest';
import { spawnTable, NEW_OBSTACLES, distanceAtTime, obstacleGates, breatherDue } from '../obstacles/difficulty.js';
import { GATES } from '../tuning.js';
import { speedParams, effectiveRules, MODE_ORDER } from '../modes.js';

const kinds = (d, opts) => spawnTable(d, opts).map(([k]) => k);

describe('distanceAtTime', () => {
  const kin = { start: 13, max: 31, accel: 0.2 };
  it('integrates the linear ramp and then the top speed', () => {
    expect(distanceAtTime(0, kin)).toBe(0);
    expect(distanceAtTime(10, kin)).toBeCloseTo(13 * 10 + 0.5 * 0.2 * 100);
    expect(distanceAtTime(90, kin)).toBeCloseTo(13 * 90 + 0.1 * 8100);
    expect(distanceAtTime(100, kin)).toBeCloseTo(distanceAtTime(90, kin) + 31 * 10);
  });
  it('copes with a zero acceleration', () => {
    expect(distanceAtTime(5, { start: 10, max: 10, accel: 0 })).toBe(50);
  });
});

describe('time-based gates', () => {
  it('place each new obstacle at the same run time in every mode', () => {
    for (const id of MODE_ORDER) {
      const kin = speedParams(id, 1);
      const g = obstacleGates(kin);
      expect(g.boulder.after).toBeCloseTo(distanceAtTime(GATES.boulder.atS, kin));
      expect(g.log.after).toBeCloseTo(distanceAtTime(GATES.log.atS, kin));
      expect(g.meteor.after).toBeCloseTo(distanceAtTime(GATES.meteor.atS, kin));
    }
  });
  it('removes the fast-mode cliff: Hardcore sees the boulder later in metres than Classic, but at the same time', () => {
    const classic = obstacleGates(speedParams('classic', 1));
    const hard = obstacleGates(speedParams('hardcore', 1));
    expect(hard.boulder.after).toBeGreaterThan(classic.boulder.after);
  });
  it('lets Time Attack reach the whole table inside its 60 s', () => {
    const g = obstacleGates(speedParams('timeattack', 1));
    const dist60 = distanceAtTime(60, speedParams('timeattack', 1));
    expect(g.meteor.after + g.ramp).toBeLessThanOrEqual(dist60 + 1);
  });
  it('drives the spawn table through spawnTable(distance, { gates })', () => {
    const g = obstacleGates(speedParams('classic', 1));
    expect(kinds(g.boulder.after - 1, { newObstacles: true, gates: g })).not.toContain('boulder');
    expect(kinds(g.boulder.after + 10, { newObstacles: true, gates: g })).toContain('boulder');
    expect(kinds(g.meteor.after + g.ramp, { newObstacles: true, gates: g })).toContain('meteor');
    expect(kinds(10000, { newObstacles: true, gates: g })).not.toContain('ramp');
    const w = (d) => Object.fromEntries(spawnTable(d, { newObstacles: true, gates: g })).boulder;
    expect(w(g.boulder.after + g.ramp)).toBe(GATES.boulder.weight);
  });
  it('is the legacy distance table when no gates are passed, and Classic stays the original table', () => {
    expect(kinds(300, { newObstacles: true })).toContain('boulder');
    expect(NEW_OBSTACLES.boulder.after).toBe(250);
    expect(kinds(1000)).toEqual(['cactusS', 'cactusL', 'group2', 'group3', 'weed', 'pteroLow', 'pteroMid', 'pteroHigh']);
    expect(kinds(1000, { newObstacles: false, gates: null })).toEqual(kinds(1000));
  });
  it('only gives gates and breathers to rule sets with new obstacles', () => {
    expect(effectiveRules('zen', {}, 1).gates).not.toBeNull();
    expect(effectiveRules('classic', { classicPlus: true }, 1).breather).not.toBeNull();
    expect(effectiveRules('classic', { classicPlus: false }, 1).gates).toBeNull();
  });
  it('scales with the difficulty multiplier', () => {
    const easy = effectiveRules('classic', { classicPlus: true }, 0.85).gates.boulder.after;
    const hard = effectiveRules('classic', { classicPlus: true }, 1.15).gates.boulder.after;
    expect(hard).toBeGreaterThan(easy);
  });
});

describe('breathers', () => {
  const kin = speedParams('classic', 1);
  it('become due every GATES.breatherEveryS of play', () => {
    const d1 = distanceAtTime(GATES.breatherEveryS, kin);
    expect(breatherDue(d1 - 1, 1, kin)).toBe(false);
    expect(breatherDue(d1, 1, kin)).toBe(true);
    expect(breatherDue(d1, 2, kin)).toBe(false);
    expect(breatherDue(distanceAtTime(GATES.breatherEveryS * 2, kin), 2, kin)).toBe(true);
    expect(GATES.breatherGapMult).toBeGreaterThan(1);
  });
});
