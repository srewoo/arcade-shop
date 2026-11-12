import { describe, expect, it } from 'vitest';
import { assignKinds, makeSetup, pickFishFrames, rackSpots } from '../src/layout';
import { hashSeed, intBetween, mulberry32, shuffled } from '../src/rng';

describe('rng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = mulberry32(42), b = mulberry32(42), c = mulberry32(43);
    const seqA = [a(), a(), a()], seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    expect([c(), c(), c()]).not.toEqual(seqA);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('hashSeed separates streams', () => {
    expect(hashSeed(1, 2, 3)).toBe(hashSeed(1, 2, 3));
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(1, 3, 2));
  });
  it('shuffles without losing items', () => {
    const out = shuffled(mulberry32(5), [1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(shuffled(mulberry32(5), [1, 2, 3, 4, 5, 6])).toEqual(out);
  });
  it('intBetween is inclusive', () => {
    const rng = mulberry32(9);
    const seen = new Set(Array.from({ length: 200 }, () => intBetween(rng, 1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
});

describe('layout', () => {
  it('builds a 10-cat triangle with the head cat in front', () => {
    const spots = rackSpots();
    expect(spots).toHaveLength(10);
    expect(spots[0]?.y).toBe(0);
    expect(Math.min(...spots.map((s) => s.x))).toBe(spots[0]?.x);
    expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(10);
  });
  it('assigns personalities within limits, never a scaredy head cat', () => {
    for (let seed = 1; seed < 200; seed++) {
      const kinds = assignKinds(mulberry32(seed));
      const lazy = kinds.filter((k) => k === 'lazy').length;
      const scared = kinds.filter((k) => k === 'scaredy').length;
      expect(lazy).toBeGreaterThanOrEqual(1);
      expect(lazy).toBeLessThanOrEqual(2);
      expect(scared).toBeLessThanOrEqual(2);
      expect(kinds[0]).not.toBe('scaredy');
    }
  });
  it('same seed gives the same rack, fish frames are 3 distinct frames', () => {
    expect(makeSetup(77, true)).toEqual(makeSetup(77, true));
    expect(makeSetup(77, false).fish).toBeNull();
    for (let s = 0; s < 50; s++) {
      const f = pickFishFrames(mulberry32(s));
      expect(new Set(f).size).toBe(3);
      expect(f.every((n) => n >= 1 && n <= 10)).toBe(true);
    }
  });
});
