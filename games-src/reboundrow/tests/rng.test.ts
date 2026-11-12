import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';

describe('rng', () => {
  it('repeats for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });
  it('differs across seeds and stays in range', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
    const r = createRng(5);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(r.int(6)).toBeLessThan(6);
    }
  });
  it('pick throws on empty lists', () => {
    expect(() => createRng(1).pick([])).toThrow();
    expect(createRng(1).pick(['x'])).toBe('x');
  });
});
