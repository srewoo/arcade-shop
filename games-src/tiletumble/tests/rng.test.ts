import { describe, expect, it } from 'vitest';
import { dailySeed, dateKey, hashString, Rng } from '../src/rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect(Array.from({ length: 8 }, () => a.next())).toEqual(Array.from({ length: 8 }, () => b.next()));
  });
  it('differs between seeds', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });
  it('stays in [0,1) and int stays inclusive in range', () => {
    const r = new Rng(7);
    for (let i = 0; i < 500; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
  });
  it('restores from a saved state', () => {
    const r = new Rng(9);
    r.next();
    const saved = r.state;
    const expected = [r.next(), r.next()];
    r.state = saved;
    expect([r.next(), r.next()]).toEqual(expected);
  });
});

describe('seeds', () => {
  it('hashes strings stably', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
  it('formats local dates and derives per-day seeds', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dailySeed('2026-01-05')).toBe(dailySeed('2026-01-05'));
    expect(dailySeed('2026-01-05')).not.toBe(dailySeed('2026-01-06'));
  });
});
