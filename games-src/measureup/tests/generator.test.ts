import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { generateQuick, tierById } from '../src/generator';
import { isGoal, validateShape } from '../src/jugs';
import { createRng } from '../src/rng';
import { solve } from '../src/solver';

describe('rng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 8 }, () => a.next());
    expect(seqA).toEqual(Array.from({ length: 8 }, () => b.next()));
    expect(seqA).not.toEqual(Array.from({ length: 8 }, () => createRng(43).next()));
  });
  it('stays in range', () => {
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const n = r.int(3, 6);
      expect(n >= 3 && n <= 6).toBe(true);
    }
  });
  it('pick throws on an empty list and returns members otherwise', () => {
    expect(() => createRng(1).pick([])).toThrow();
    expect(['a', 'b']).toContain(createRng(1).pick(['a', 'b']));
  });
  it('matches a known first value (pins the algorithm)', () => {
    expect(createRng(1).next()).toBeCloseTo(0.6270739405881613, 10);
  });
});

describe('quick puzzles', () => {
  it('same seed and tier give the identical level', () => {
    for (const tier of CONFIG.quick.tiers) expect(generateQuick(1234, tier.id)).toEqual(generateQuick(1234, tier.id));
  });
  it('different seeds usually differ', () => {
    const names = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(generateQuick(i + 1, 'medium').jugs)));
    expect(names.size).toBeGreaterThan(3);
  });
  it('every generated puzzle is solvable with par inside the tier window', () => {
    for (const tier of CONFIG.quick.tiers) {
      for (let seed = 1; seed <= 25; seed++) {
        const l = generateQuick(seed, tier.id);
        expect(validateShape(l.jugs, l.start, l.goal)).toBeNull();
        expect(isGoal(l.start, l.goal)).toBe(false);
        expect(solve(l.jugs, l.start, l.goal)?.length).toBe(l.par);
        expect(l.par).toBeGreaterThanOrEqual(tier.parMin);
        expect(l.par).toBeLessThanOrEqual(tier.parMax);
      }
    }
  });
  it('unknown tier falls back to easy', () => {
    expect(tierById('nope').id).toBe('easy');
  });
});
