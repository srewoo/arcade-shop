import { describe, expect, it } from 'vitest';
import { dailyKey, generateDaily } from '../src/daily';
import { createRng, hashString } from '../src/rng';
import { buildSolver } from '../src/solver';
import { CONFIG } from '../src/config';

describe('rng', () => {
  it('same seed gives the same sequence, different seeds differ', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 8 }, () => a.next());
    expect(Array.from({ length: 8 }, () => b.next())).toEqual(seqA);
    expect(Array.from({ length: 8 }, () => createRng(43).next())).not.toEqual(seqA);
  });
  it('stays in range', () => {
    const r = createRng(1);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(r.int(7)).toBeLessThan(7);
    }
  });
  it('hashString is stable', () => {
    expect(hashString('lilyhop')).toBe(hashString('lilyhop'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

describe('daily puzzle', () => {
  it('is deterministic per date', () => {
    expect(generateDaily('2026-11-11')).toEqual(generateDaily('2026-11-11'));
  });
  it('is solvable and not trivial for many dates', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-02-${String(d).padStart(2, '0')}`;
      const p = generateDaily(date);
      const opt = buildSolver(p.spec).optimal;
      expect(opt, date).toBeGreaterThanOrEqual(CONFIG.daily.minDistance);
    }
  });
  it('formats the local date key', () => {
    expect(dailyKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
