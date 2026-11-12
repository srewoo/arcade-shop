import { describe, expect, it } from 'vitest';
import { createRng, dailyKey, dateStamp, hashSeed, mulberry32 } from '../src/rng';
import { seedKeyFor } from '../src/modes';

describe('seeded RNG', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = mulberry32(42), b = mulberry32(42), c = mulberry32(43);
    const xs = Array.from({ length: 20 }, () => a());
    expect(xs).toEqual(Array.from({ length: 20 }, () => b()));
    expect(xs).not.toEqual(Array.from({ length: 20 }, () => c()));
  });
  it('stays in [0,1) and helpers respect bounds', () => {
    const r = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = r.int(3, 6);
      expect([3, 4, 5, 6]).toContain(n);
      const f = r.range(-2, 2);
      expect(f).toBeGreaterThanOrEqual(-2);
      expect(f).toBeLessThan(2);
    }
  });
  it('hashSeed is stable', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
    expect(hashSeed('daily-2026-11-11')).toBe(hashSeed('daily-2026-11-11'));
  });
  it('daily key uses the UTC date', () => {
    expect(dateStamp(new Date('2026-11-11T23:59:59Z'))).toBe('2026-11-11');
    expect(dailyKey(new Date('2026-11-12T00:00:00Z'))).toBe('daily-2026-11-12');
  });
  it('mode seed keys: daily/practice fixed, endless random', () => {
    const d = new Date('2026-01-02T10:00:00Z');
    expect(seedKeyFor('daily', d, () => 0.1)).toBe('daily-2026-01-02');
    expect(seedKeyFor('practice', d, () => 0.1)).toBe(seedKeyFor('practice', d, () => 0.9));
    expect(seedKeyFor('endless', d, () => 0.1)).not.toBe(seedKeyFor('endless', d, () => 0.9));
  });
});
