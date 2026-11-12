import { describe, expect, it } from 'vitest';
import { createRng } from '../src/rng';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });
  it('differs between seeds and stays in [0,1)', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('int/range/pick stay in bounds and state can resume', () => {
    const r = createRng(9);
    for (let i = 0; i < 200; i++) {
      expect(r.int(5)).toBeLessThan(5);
      const v = r.range(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThan(20);
      expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    }
    const saved = r.state;
    const x = r.next();
    r.state = saved;
    expect(r.next()).toBe(x);
  });
});
