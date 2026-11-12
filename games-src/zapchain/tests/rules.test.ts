import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { createRng } from '../src/rng';
import { feederKind, levelBonus, levelParams, openingHeights, zapPoints } from '../src/model/rules';

describe('level parameters (original curve)', () => {
  it('level 1: 3 colours, up to 5 rows, 85 s, 50 discs, no bombs', () => {
    expect(levelParams(1)).toMatchObject({ colours: 3, maxRows: 5, seconds: 85, target: 50, bombs: false });
    expect(levelParams(1).spawnInterval).toBeCloseTo(0.14, 5);
  });
  it('colours cap at 5 and start rows cap at 8; bombs from level 2', () => {
    expect(levelParams(3)).toMatchObject({ colours: 5, maxRows: 7, seconds: 95, target: 70, bombs: true });
    expect(levelParams(9)).toMatchObject({ colours: 5, maxRows: 8, target: 130 });
  });
  it('the feeder never gets slower than the floor interval from level 2', () => {
    expect(levelParams(2).spawnInterval).toBe(CONFIG.level.minSpawnInterval);
    expect(levelParams(30).spawnInterval).toBe(CONFIG.level.minSpawnInterval);
  });
  it('clamps nonsense levels to 1', () => {
    expect(levelParams(0).level).toBe(1);
    expect(levelParams(-4).level).toBe(1);
  });
});

describe('scoring', () => {
  it('is superlinear: 2^n, and each extra disc doubles the zap', () => {
    expect(zapPoints(2)).toBe(4);
    expect(zapPoints(5)).toBe(32);
    for (let n = 2; n < 15; n++) expect(zapPoints(n + 1)).toBe(zapPoints(n) * 2);
    expect(zapPoints(8) / 8).toBeGreaterThan(zapPoints(4) / 4);
  });
  it('caps the exponent and ignores empty zaps', () => {
    expect(zapPoints(60)).toBe(2 ** CONFIG.score.exponentCap);
    expect(zapPoints(0)).toBe(0);
  });
  it('level bonus scales with level and the share of clock left', () => {
    expect(levelBonus(2, 50, 100)).toBe(5000);
    expect(levelBonus(1, 85, 85)).toBe(5000);
    expect(levelBonus(1, 0, 85)).toBe(0);
    expect(levelBonus(3, 200, 100)).toBe(15000);
    expect(levelBonus(1, 10, 0)).toBe(0);
  });
});

describe('opening board and feeder', () => {
  it('is deterministic per seed and within bounds', () => {
    const p = levelParams(1);
    const a = openingHeights(createRng(5), p);
    expect(a).toEqual(openingHeights(createRng(5), p));
    expect(a).toHaveLength(10);
    for (const h of a) { expect(h).toBeGreaterThanOrEqual(1); expect(h).toBeLessThanOrEqual(p.maxRows); }
  });
  it('never feeds bombs on level 1, and feeds some later', () => {
    const rng = createRng(9);
    for (let i = 0; i < 400; i++) expect(feederKind(rng, levelParams(1))).toBeLessThanOrEqual(3);
    let bombs = 0;
    for (let i = 0; i < 2000; i++) if (feederKind(rng, levelParams(3)) === 6) bombs++;
    expect(bombs).toBeGreaterThan(20);
    expect(bombs).toBeLessThan(140);
  });
});
