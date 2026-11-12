import { describe, expect, it } from 'vitest';
import { Rng, roundSeed } from '../src/rng';

describe('Rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });
  it('differs between seeds', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });
  it('stays in [0,1) and range() respects bounds', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const x = r.range(3, 5);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThan(5);
    }
  });
  it('roughly uniform', () => {
    const r = new Rng(99);
    let below = 0;
    for (let i = 0; i < 4000; i++) if (r.next() < 0.5) below++;
    expect(below).toBeGreaterThan(1800);
    expect(below).toBeLessThan(2200);
  });
  it('pick returns members and throws on empty', () => {
    const r = new Rng(3);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    expect(() => r.pick([])).toThrow();
  });
  it('roundSeed spreads rounds and is stable', () => {
    expect(roundSeed(5, 1)).toBe(roundSeed(5, 1));
    const seeds = new Set(Array.from({ length: 30 }, (_, i) => roundSeed(5, i)));
    expect(seeds.size).toBe(30);
  });
  it('golden values stay put (seeded plans must not drift)', () => {
    const r = new Rng(1);
    expect(r.next()).toBeCloseTo(0.6270739405881613, 12);
  });
});
