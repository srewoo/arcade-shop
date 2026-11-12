import { describe, expect, it } from 'vitest';
import { Bag } from '../src/core/bag';
import { Rng } from '../src/core/rng';
import { cellsOf, ROTATIONS, SHAPE_IDS, shapeSize } from '../src/core/shapes';

describe('7-bag', () => {
  it('serves each shape exactly once per group of 7', () => {
    const bag = new Bag(new Rng(42));
    for (let g = 0; g < 50; g++) {
      const group = Array.from({ length: 7 }, () => bag.next());
      expect([...group].sort()).toEqual([...SHAPE_IDS].sort());
    }
  });
  it('is deterministic per seed and differs across seeds', () => {
    const a = new Bag(new Rng(7)).peek(21);
    const b = new Bag(new Rng(7)).peek(21);
    const c = new Bag(new Rng(8)).peek(21);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
  it('peek does not consume', () => {
    const bag = new Bag(new Rng(3));
    const look = bag.peek(5);
    expect([bag.next(), bag.next(), bag.next(), bag.next(), bag.next()]).toEqual(look);
  });
});

describe('rotation states', () => {
  it('every state has 4 distinct cells inside the box', () => {
    for (const id of SHAPE_IDS) {
      for (let r = 0; r < 4; r++) {
        const cells = cellsOf(id, r);
        expect(new Set(cells.map((c) => c.join(','))).size).toBe(4);
        for (const [x, y] of cells) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(shapeSize(id));
          expect(x).toBeLessThan(shapeSize(id));
        }
      }
    }
  });
  it('four clockwise turns return to the start', () => {
    for (const id of SHAPE_IDS) expect(cellsOf(id, 4)).toEqual(cellsOf(id, 0));
  });
  it('the cube never changes; the bar alternates flat and upright', () => {
    const norm = (id: 'cube', r: number) => cellsOf(id, r).map((c) => c.join(',')).sort();
    expect(norm('cube', 1)).toEqual(norm('cube', 0));
    const xs = new Set(ROTATIONS.bar[1]?.map((c) => c[0]));
    expect(xs.size).toBe(1);
    expect(new Set(ROTATIONS.bar[0]?.map((c) => c[1])).size).toBe(1);
  });
});
