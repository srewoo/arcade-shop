import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { isUnlocked, nextLevelId, parseProgress, recordResult } from '../src/progress';

describe('progress parsing', () => {
  it('returns empty for junk', () => {
    expect(parseProgress(null)).toEqual({ levels: {} });
    expect(parseProgress('x')).toEqual({ levels: {} });
    expect(parseProgress({ levels: 5 })).toEqual({ levels: {} });
  });
  it('keeps valid records and drops invalid ones per level', () => {
    const p = parseProgress({ levels: { 'classic-2': { stars: 3, bestMoves: 8, bestMs: 1000 }, 'classic-3': { stars: 9 }, bogus: { stars: 1 } } });
    expect(Object.keys(p.levels)).toEqual(['classic-2']);
  });
  it('falls back per field inside a record', () => {
    const p = parseProgress({ levels: { 'classic-2': { stars: 2, bestMoves: 'x', bestMs: -5 } } });
    expect(p.levels['classic-2']).toEqual({ stars: 2, bestMoves: 0, bestMs: 0 });
  });
  it('validates the daily record date', () => {
    expect(parseProgress({ levels: {}, daily: { date: '2026-11-11', stars: 2, bestMoves: 9, bestMs: 5 } }).daily?.date).toBe('2026-11-11');
    expect(parseProgress({ levels: {}, daily: { date: 'nope', stars: 2 } }).daily).toBeUndefined();
  });
});

describe('records and unlocking', () => {
  it('keeps best values and reports improvement', () => {
    let p = parseProgress(null);
    const first = recordResult(p, 'classic-2', 12, 9000, 2);
    expect(first.improved).toBe(true);
    p = first.progress;
    const worse = recordResult(p, 'classic-2', 14, 5000, 1);
    expect(worse.improved).toBe(false);
    expect(worse.progress.levels['classic-2']).toEqual({ stars: 2, bestMoves: 12, bestMs: 5000 });
    expect(recordResult(worse.progress, 'classic-2', 8, 8000, 3).improved).toBe(true);
  });
  it('tracks the daily separately by date', () => {
    const a = recordResult({ levels: {} }, 'daily', 10, 100, 2, '2026-11-11').progress;
    expect(a.daily?.date).toBe('2026-11-11');
    const b = recordResult(a, 'daily', 20, 100, 1, '2026-11-12').progress;
    expect(b.daily).toMatchObject({ date: '2026-11-12', bestMoves: 20 });
  });
  it('unlocks levels in order', () => {
    const empty = parseProgress(null);
    expect(isUnlocked(empty, LEVELS[0]!.id)).toBe(true);
    expect(isUnlocked(empty, LEVELS[1]!.id)).toBe(false);
    const done = recordResult(empty, LEVELS[0]!.id, 8, 1, 3).progress;
    expect(isUnlocked(done, LEVELS[1]!.id)).toBe(true);
    expect(isUnlocked(done, 'nope')).toBe(false);
  });
  it('opens the first level of every group without finishing the previous group', () => {
    const empty = parseProgress(null);
    for (const g of ['classic', 'gaps', 'grid'] as const) {
      const first = LEVELS.find((l) => l.group === g)!;
      expect(isUnlocked(empty, first.id)).toBe(true);
    }
    const second = LEVELS.filter((l) => l.group === 'gaps')[1]!;
    expect(isUnlocked(empty, second.id)).toBe(false);
  });
  it('knows the next level', () => {
    expect(nextLevelId(LEVELS[0]!.id)).toBe(LEVELS[1]!.id);
    expect(nextLevelId(LEVELS[LEVELS.length - 1]!.id)).toBeUndefined();
  });
});
