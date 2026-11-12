import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { hashSeed } from '../src/rng';
import { World, gapAt } from '../src/world';

const W = CONFIG.world;
const seeds = Array.from({ length: 40 }, (_, i) => hashSeed(`world-${i}`));

describe('world determinism', () => {
  it('same seed gives identical terrain, obstacles and coins regardless of query order', () => {
    const a = new World(123);
    const b = new World(123);
    a.ensure(20000);
    b.ceilAt(15000);
    b.ensure(20000);
    expect(a.ceil.slice(0, 900)).toEqual(b.ceil.slice(0, 900));
    expect(a.obstacles.slice(0, 20)).toEqual(b.obstacles.slice(0, 20));
    expect(a.coins.slice(0, 40)).toEqual(b.coins.slice(0, 40));
  });
  it('different seeds give different tunnels', () => {
    const a = new World(1), b = new World(2);
    a.ensure(8000); b.ensure(8000);
    expect(a.ceil).not.toEqual(b.ceil);
  });
});

describe('narrowing', () => {
  it('gap shrinks with distance and floors at minGap', () => {
    expect(gapAt(0)).toBe(W.startGap);
    expect(gapAt(2000)).toBeLessThan(gapAt(1000));
    expect(gapAt(1e6)).toBe(W.minGap);
  });
  it('built tunnel width follows gapAt', () => {
    const w = new World(5);
    w.ensure(12000);
    for (const x of [0, 1000, 5000, 11000]) {
      expect(w.floorAt(x) - w.ceilAt(x)).toBeCloseTo(gapAt(x), 0);
    }
  });
});

describe('level validation', () => {
  it.each(seeds)('seed %i: walls stay in bounds, slopes are bounded, obstacles leave a pass', (seed) => {
    const w = new World(seed);
    w.ensure(16000);
    for (let k = 0; k < w.ceil.length; k++) {
      const c = w.ceil[k] as number, f = w.floor[k] as number;
      expect(c).toBeGreaterThanOrEqual(W.wallMin - 0.001);
      expect(f).toBeLessThanOrEqual(W.height - W.wallMin + 0.001);
      expect(f - c).toBeGreaterThanOrEqual(W.minGap - 0.001);
      if (k > 0) expect(Math.abs(c - (w.ceil[k - 1] as number))).toBeLessThanOrEqual(W.colW * W.maxSlope + W.colW * W.narrowPerUnit + 0.001);
    }
    for (const o of w.obstacles) {
      const [lo, hi] = w.freeSpan(o.x + o.w / 2);
      expect(hi - lo).toBeGreaterThanOrEqual(W.minPass - 0.001);
      expect(o.x).toBeGreaterThanOrEqual(W.obstacleFrom);
    }
    for (const c of w.coins) {
      const [lo, hi] = w.freeSpan(c.x);
      expect(c.y).toBeGreaterThan(lo + W.coinR);
      expect(c.y).toBeLessThan(hi - W.coinR);
    }
  });
  it('obstacles are spaced apart and the opening has no obstacles', () => {
    const w = new World(9);
    w.ensure(20000);
    expect(w.obstacles.length).toBeGreaterThan(10);
    for (let i = 1; i < w.obstacles.length; i++) {
      expect((w.obstacles[i] as { x: number }).x - (w.obstacles[i - 1] as { x: number }).x).toBeGreaterThanOrEqual(W.obsSpacingMin * W.colW - 1);
    }
  });
  it('queries return only items in range', () => {
    const w = new World(11);
    for (const o of w.obstaclesIn(3000, 4000)) expect(o.x).toBeLessThanOrEqual(4000);
    for (const c of w.coinsIn(3000, 4000)) { expect(c.x).toBeGreaterThanOrEqual(3000); expect(c.x).toBeLessThanOrEqual(4000); }
  });
});
