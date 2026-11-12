import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { applyHit, gravityAt, heightFrac, hitResult, inReach, isMiss, makeBall, stepBall } from '../src/physics';

const R = CONFIG.ball.radius;

describe('hit angle', () => {
  it('a dead-centre tap sends the ball straight up', () => {
    const b = makeBall(200, 300);
    const h = hitResult(b, 200, 300);
    expect(h.vx).toBeCloseTo(0, 6);
    expect(h.vy).toBeLessThan(0);
    expect(h.sweet).toBe(true);
  });
  it('tap left of centre sends it right; tap right sends it left (symmetric)', () => {
    const b = makeBall(200, 300);
    const left = hitResult(b, 200 - R * 0.8, 300);
    const right = hitResult(b, 200 + R * 0.8, 300);
    expect(left.vx).toBeGreaterThan(0);
    expect(right.vx).toBeLessThan(0);
    expect(left.vx).toBeCloseTo(-right.vx, 6);
    expect(left.spin).toBeCloseTo(-right.spin, 6);
    expect(left.sweet).toBe(false);
  });
  it('offset grows monotonically and is clamped to the ball edge', () => {
    const b = makeBall(200, 300);
    const a = hitResult(b, 200 - R * 0.3, 300).vx;
    const c = hitResult(b, 200 - R * 0.9, 300).vx;
    const edge = hitResult(b, 200 - R * 5, 300);
    expect(c).toBeGreaterThan(a);
    expect(edge.offsetX).toBe(1);
    expect(edge.vx).toBeCloseTo(CONFIG.hit.sideSpeed, 6);
  });
  it('hitting low on the ball kicks harder than hitting high', () => {
    const b = makeBall(200, 300);
    const low = hitResult(b, 200, 300 + R * 0.9);
    const high = hitResult(b, 200, 300 - R * 0.9);
    expect(Math.abs(low.vy)).toBeGreaterThan(Math.abs(high.vy));
    expect(Math.abs(high.vy)).toBeGreaterThanOrEqual(CONFIG.hit.kick * CONFIG.hit.kickLow - 1e-9);
    expect(Math.abs(low.vy)).toBeLessThanOrEqual(CONFIG.hit.kick + 1e-9);
  });
  it('keeps a fraction of incoming sideways speed and caps launch speed', () => {
    const b = makeBall(200, 300);
    b.vx = 400;
    expect(hitResult(b, 200, 300).vx).toBeCloseTo(400 * CONFIG.hit.carry, 6);
    b.vx = 5000;
    expect(hitResult(b, 200 - R, 300).vx).toBe(CONFIG.hit.maxVx);
  });
  it('reach is a circle of radius R * slop', () => {
    const b = makeBall(200, 300);
    expect(inReach(b, 200 + R * CONFIG.hit.slop - 0.01, 300)).toBe(true);
    expect(inReach(b, 200 + R * CONFIG.hit.slop + 0.01, 300)).toBe(false);
  });
  it('applyHit sets velocity and spin', () => {
    const b = makeBall(200, 300);
    applyHit(b, { vx: 5, vy: -6, spin: 7, offsetX: 0, offsetY: 0, sweet: true });
    expect([b.vx, b.vy, b.spin]).toEqual([5, -6, 7]);
  });
});

describe('gravity ramp', () => {
  it('starts at base, rises linearly, and caps', () => {
    const g = CONFIG.gravity;
    expect(gravityAt(0)).toBe(g.base);
    expect(gravityAt(10)).toBeCloseTo(g.base + g.ramp * 10, 9);
    expect(gravityAt(-5)).toBe(g.base);
    expect(gravityAt(1e6)).toBe(g.max);
  });
  it('never decreases over time', () => {
    let prev = 0;
    for (let t = 0; t < 300; t += 7) { const v = gravityAt(t); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
  });
  it('higher gravity lowers the apex of the same kick', () => {
    const apex = (g: number): number => { const b = makeBall(200, 300); b.vy = -CONFIG.hit.kick; let top = b.y; for (let i = 0; i < 600; i++) { stepBall(b, 1 / 120, g, 0, 600); top = Math.min(top, b.y); } return 300 - top; };
    expect(apex(gravityAt(0))).toBeGreaterThan(apex(gravityAt(60)));
  });
});

describe('walls', () => {
  it('bounces off the left and right wall with damping', () => {
    const l = makeBall(R + 1, 200); l.vx = -300;
    expect(stepBall(l, 1 / 60, 0, 0, 600)).toBe('wall');
    expect(l.x).toBe(R);
    expect(l.vx).toBeCloseTo(300 * CONFIG.ball.restitutionWall, 6);
    const r = makeBall(600 - R - 1, 200); r.vx = 300;
    expect(stepBall(r, 1 / 60, 0, 0, 600)).toBe('wall');
    expect(r.vx).toBeLessThan(0);
  });
  it('wind accelerates sideways and spin decays', () => {
    const b = makeBall(300, 200); b.spin = 10;
    stepBall(b, 0.1, 0, 200, 600);
    expect(b.vx).toBeGreaterThan(19);
    expect(Math.abs(b.spin)).toBeLessThan(10);
  });
});

describe('miss detection', () => {
  it('is a miss only when the lowest point reaches the ground while falling', () => {
    const g = CONFIG.world.groundY;
    expect(isMiss({ ...makeBall(100, g - R - 1), vy: 100 })).toBe(false);
    expect(isMiss({ ...makeBall(100, g - R), vy: 100 })).toBe(true);
    expect(isMiss({ ...makeBall(100, g - R + 5), vy: -100 })).toBe(false);
  });
  it('heightFrac runs 0 on the ground to 1 above the world', () => {
    expect(heightFrac(CONFIG.world.groundY - R)).toBe(0);
    expect(heightFrac(-1000)).toBe(1);
    expect(heightFrac(250)).toBeGreaterThan(0);
  });
});
