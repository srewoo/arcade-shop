import { describe, expect, it } from 'vitest';
import { computeLayout, ROAD_W } from '../src/viewport';

describe('computeLayout', () => {
  it('centres the road and keeps the view proportional to the viewport', () => {
    for (const [w, h] of [[1280, 800], [400, 860], [860, 400], [360, 640]] as const) {
      const v = computeLayout(w, h);
      expect(v.width * v.scale).toBeCloseTo(w, 3);
      expect(v.height * v.scale).toBeCloseTo(h, 3);
      expect(v.roadLeft * 2 + ROAD_W).toBeCloseTo(v.width, 3);
      expect(v.roadLeft).toBeGreaterThanOrEqual(19.999);
    }
  });
  it('fills the whole stage and enlarges the road versus the old fixed 400x640 box', () => {
    const old = (w: number, h: number): number => Math.min(w / 400, h / 640);
    for (const [w, h] of [[1280, 800], [860, 400], [400, 860]] as const) {
      expect(computeLayout(w, h).scale).toBeGreaterThan(old(w, h));
    }
  });
  it('keeps enough road ahead of the player (>= 40 units) and some behind', () => {
    for (const [w, h] of [[1280, 800], [400, 860], [860, 400], [320, 500]] as const) {
      const v = computeLayout(w, h);
      expect(v.playerY / v.pxPerU).toBeGreaterThanOrEqual(40);
      expect(v.height - v.playerY).toBeGreaterThanOrEqual(80);
    }
  });
  it('fits the road in narrow screens', () => {
    const v = computeLayout(320, 700);
    expect(ROAD_W * v.scale).toBeLessThanOrEqual(320);
  });
});
