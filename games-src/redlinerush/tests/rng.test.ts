import { describe, expect, it } from 'vitest';
import { createRng, dailySeed, dayKey, hashSeed } from '../src/rng';

describe('rng determinism', () => {
  it('same seed gives the same sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 50; i++) expect(a.next()).toBe(b.next());
  });
  it('different seeds diverge', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('stays in [0,1) and int() in range', () => {
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(r.int(5)).toBeLessThan(5);
    }
  });
  it('pick throws on an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });
});

describe('daily seed', () => {
  it('formats the local day with zero padding', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 10, 11))).toBe('2026-11-11');
  });
  it('is stable per day and differs between days', () => {
    expect(dailySeed('2026-11-11')).toBe(dailySeed('2026-11-11'));
    expect(dailySeed('2026-11-11')).not.toBe(dailySeed('2026-11-12'));
  });
  it('hashSeed is a stable uint32', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
    expect(hashSeed('abc')).toBeLessThan(2 ** 32);
  });
});
