import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { bounceSpeed, circleHitsRect, collideRect, lineHitsBubble, makeBubble, radiusOf, splitChildren, stepBubble } from '../src/sim/physics';

const { w: W, floorY } = CONFIG.world;
const dt = CONFIG.sim.dt;

function apexAfterBounce(size: number, solids: { x: number; y: number; w: number; h: number }[] = []): number {
  const b = makeBubble(1, 300, floorY - radiusOf(size) - 1, size, 1);
  b.vy = 200;
  let bounced = false;
  let top = b.y;
  for (let i = 0; i < 600; i++) {
    const o = stepBubble(b, dt, solids);
    if (o.floorBounce) bounced = true;
    if (bounced) { top = Math.min(top, b.y); if (b.vy > 0 && i > 20) break; }
  }
  return floorY - radiusOf(size) - top;
}

describe('bounce physics', () => {
  it('bounces to a size-dependent height that grows with size', () => {
    const heights = [0, 1, 2, 3].map((s) => apexAfterBounce(s));
    for (let s = 0; s < 4; s++) expect(heights[s]).toBeCloseTo(CONFIG.bubble.bounceHeight[s] as number, -1);
    expect(heights[0]!).toBeLessThan(heights[1]!);
    expect(heights[1]!).toBeLessThan(heights[2]!);
    expect(heights[2]!).toBeLessThan(heights[3]!);
  });

  it('bounceSpeed gives exactly the configured apex energy', () => {
    const v = bounceSpeed(3);
    expect((v * v) / (2 * CONFIG.physics.gravity)).toBeCloseTo(CONFIG.bubble.bounceHeight[3] as number, 6);
  });

  it('reflects off both side walls and the ceiling without losing horizontal speed', () => {
    const b = makeBubble(1, 40, 100, 2, -1);
    const speed = Math.abs(b.vx);
    for (let i = 0; i < 120; i++) stepBubble(b, dt, []);
    expect(b.x).toBeGreaterThanOrEqual(radiusOf(2));
    expect(b.vx).toBeCloseTo(speed, 6);
    const c = makeBubble(2, W - 30, 100, 1, 1);
    for (let i = 0; i < 60; i++) stepBubble(c, dt, []);
    expect(c.x + radiusOf(1)).toBeLessThanOrEqual(W);
    const d = makeBubble(3, 300, 40, 3, 1);
    d.vy = -900;
    stepBubble(d, dt, []);
    expect(d.y - radiusOf(3)).toBeGreaterThanOrEqual(CONFIG.world.ceilY);
    expect(d.vy).toBeGreaterThan(0);
  });

  it('is deterministic: same start gives identical trajectories', () => {
    const run = (): number[] => {
      const b = makeBubble(1, 100, 120, 3, 1);
      for (let i = 0; i < 500; i++) stepBubble(b, dt, []);
      return [b.x, b.y, b.vx, b.vy];
    };
    expect(run()).toEqual(run());
  });

  it('lands on a platform with the same apex height as the floor', () => {
    const plat = { x: 200, y: 250, w: 200, h: 9 };
    const b = makeBubble(1, 300, 150, 2, 1);
    b.vx = 0;
    let landedAt = -1;
    let top = Infinity;
    for (let i = 0; i < 400; i++) {
      stepBubble(b, dt, [plat]);
      if (landedAt < 0 && b.vy < 0 && b.y + radiusOf(2) <= plat.y + 2) landedAt = i;
      if (landedAt >= 0) top = Math.min(top, b.y);
    }
    expect(landedAt).toBeGreaterThan(0);
    expect(plat.y - radiusOf(2) - top).toBeCloseTo(CONFIG.bubble.bounceHeight[2] as number, -1);
  });

  it('bounces sideways off a block face and pushes out of it', () => {
    const block = { x: 300, y: 200, w: 40, h: 40 };
    const b = makeBubble(1, 285, 220, 2, 1);
    b.vy = 0;
    const hit = collideRect(b, block);
    expect(hit).toBe(true);
    expect(b.vx).toBeLessThan(0);
    expect(b.x + radiusOf(2)).toBeLessThanOrEqual(block.x + 0.001);
  });

  it('rises into the underside of a ledge and is sent back down', () => {
    const plat = { x: 200, y: 100, w: 200, h: 9 };
    const b = makeBubble(1, 300, 140, 2, 1);
    b.vy = -400;
    let touched = false;
    for (let i = 0; i < 30 && !touched; i++) touched = stepBubble(b, dt, [plat]).hitSolid;
    expect(touched).toBe(true);
    expect(b.vy).toBeGreaterThanOrEqual(0);
  });
});

describe('collision helpers', () => {
  it('line hits a bubble inside its radius and misses outside it', () => {
    const b = makeBubble(1, 300, 200, 2, 1);
    expect(lineHitsBubble(300 + radiusOf(2) - 1, 100, 1.5, b)).toBe(true);
    expect(lineHitsBubble(300 + radiusOf(2) + 5, 100, 1.5, b)).toBe(false);
  });
  it('line tip below the bubble does not hit it', () => {
    const b = makeBubble(1, 300, 100, 1, 1);
    expect(lineHitsBubble(300, 200, 1.5, b)).toBe(false);
    expect(lineHitsBubble(300, 100, 1.5, b)).toBe(true);
  });
  it('circle vs rect', () => {
    const r = { x: 0, y: 0, w: 10, h: 10 };
    expect(circleHitsRect(15, 5, 6, r)).toBe(true);
    expect(circleHitsRect(20, 5, 6, r)).toBe(false);
  });
});

describe('split rule', () => {
  it('every size above 0 splits into two bubbles one size smaller flying apart', () => {
    for (const size of [1, 2, 3]) {
      let id = 10;
      const kids = splitChildren(makeBubble(1, 300, 150, size, 1), () => id++);
      expect(kids).toHaveLength(2);
      expect(kids.map((k) => k.size)).toEqual([size - 1, size - 1]);
      expect(kids[0]!.vx).toBeLessThan(0);
      expect(kids[1]!.vx).toBeGreaterThan(0);
      expect(kids.every((k) => k.vy < 0)).toBe(true);
      expect(new Set(kids.map((k) => k.id)).size).toBe(2);
    }
  });
  it('the smallest size pops without children', () => {
    expect(splitChildren(makeBubble(1, 300, 150, 0, 1), () => 5)).toEqual([]);
  });
  it('total pops needed for a large bubble is 15 (1+2+4+8)', () => {
    let id = 1;
    const queue = [makeBubble(id++, 300, 150, 3, 1)];
    let pops = 0;
    while (queue.length) {
      const b = queue.pop()!;
      pops++;
      queue.push(...splitChildren(b, () => id++));
    }
    expect(pops).toBe(15);
  });
});
