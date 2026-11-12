import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });
  it('differs between seeds and stays in range', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(r.int(5)).toBeLessThan(5);
      const x = r.range(3, 4);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThan(4);
    }
  });
  it('matches the known first values for seed 1', () => {
    const r = createRng(1);
    expect(r.next()).toBeCloseTo(0.6270739405881613, 12);
  });
});
