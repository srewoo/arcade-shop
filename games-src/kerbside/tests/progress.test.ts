import { describe, expect, it } from 'vitest';
import type { LevelRecord } from '../src/progress';
import { isUnlocked, mergeRecord, parseProgress, totalStars } from '../src/progress';

const rec: LevelRecord = { stars: 2, bestTime: 30, bestDamage: 1, bestScore: 1500 };

describe('progress', () => {
  it('drops invalid entries individually', () => {
    const p = parseProgress({ '1': rec, '2': { stars: 9 }, '3': 'x', '99': rec, abc: rec, '4': { ...rec, bestTime: -1 } }, 24);
    expect(Object.keys(p)).toEqual(['1']);
  });
  it('tolerates non-objects', () => {
    expect(parseProgress(null, 24)).toEqual({});
    expect(parseProgress([1, 2], 24)).toEqual({});
  });
  it('merges best-of-each', () => {
    const merged = mergeRecord(rec, { stars: 1, time: 20, damage: 3, score: 900 });
    expect(merged).toEqual({ stars: 2, bestTime: 20, bestDamage: 1, bestScore: 1500 });
    expect(mergeRecord(undefined, { stars: 3, time: 9, damage: 0, score: 1 }).stars).toBe(3);
  });
  it('unlocks level n after a star on n-1', () => {
    expect(isUnlocked({}, 1)).toBe(true);
    expect(isUnlocked({}, 2)).toBe(false);
    expect(isUnlocked({ 1: rec }, 2)).toBe(true);
    expect(isUnlocked({ 1: { ...rec, stars: 0 as const } }, 2)).toBe(false);
  });
  it('totals stars', () => {
    expect(totalStars({ 1: rec, 2: { ...rec, stars: 3 as const } })).toBe(5);
  });
});
