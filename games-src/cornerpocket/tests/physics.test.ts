import { describe, expect, it } from 'vitest';
import { BALL_R, MAX_SPEED, POCKETS, TABLE_H, TABLE_W } from '../src/constants';
import { type Ball, makeBall, reflectCushions, resolveBalls, stepWorld, type SimEvent } from '../src/physics';
import { simulateShot } from '../src/sim';

const mk = (id: number, x: number, y: number, vx = 0, vy = 0): Ball => ({ ...makeBall(id, x, y), vx, vy });
const momentum = (a: Ball, b: Ball): [number, number] => [a.vx + b.vx, a.vy + b.vy];
const energy = (a: Ball, b: Ball): number => a.vx ** 2 + a.vy ** 2 + b.vx ** 2 + b.vy ** 2;

describe('ball-ball collisions', () => {
  it('conserves momentum (and swaps velocity) in a head-on hit', () => {
    const a = mk(0, 100, 100, 500, 0);
    const b = mk(1, 100 + 2 * BALL_R - 0.5, 100);
    const before = momentum(a, b);
    expect(resolveBalls(a, b)).toBeCloseTo(500);
    const after = momentum(a, b);
    expect(after[0]).toBeCloseTo(before[0], 6);
    expect(after[1]).toBeCloseTo(before[1], 6);
    expect(a.vx).toBeCloseTo(0, 6);
    expect(b.vx).toBeCloseTo(500, 6);
  });

  it('splits at 90 degrees for equal masses (elastic, target at rest)', () => {
    const a = mk(0, 100, 100, 600, 0);
    const b = mk(1, 100 + 17, 100 + 10); // off-centre contact, distance 19.7 < 20
    const e0 = energy(a, b);
    resolveBalls(a, b);
    expect(a.vx * b.vx + a.vy * b.vy).toBeCloseTo(0, 4);
    expect(energy(a, b)).toBeCloseTo(e0, 4);
    expect(Math.hypot(a.vx, a.vy)).toBeGreaterThan(1);
    expect(Math.hypot(b.vx, b.vy)).toBeGreaterThan(1);
  });

  it('ignores separating or distant balls', () => {
    expect(resolveBalls(mk(0, 0, 0, -5, 0), mk(1, 19, 0))).toBe(0);
    expect(resolveBalls(mk(0, 0, 0, 5, 0), mk(1, 50, 0))).toBe(0);
  });
});

describe('cushions', () => {
  it('reflects the normal component with restitution and keeps the tangent', () => {
    const b = mk(0, 300, TABLE_H - BALL_R + 1, 200, 300);
    const hit = reflectCushions(b, 0.8);
    expect(hit).toBeCloseTo(300);
    expect(b.vy).toBeCloseTo(-240);
    expect(b.vx).toBeCloseTo(200);
    expect(b.y).toBeLessThanOrEqual(TABLE_H - BALL_R);
  });

  it('bounces off the left and right cushions', () => {
    const l = mk(0, BALL_R - 1, 200, -100, 0);
    reflectCushions(l, 1);
    expect(l.vx).toBeCloseTo(100);
    const r = mk(0, TABLE_W - BALL_R + 1, 200, 100, 0);
    reflectCushions(r, 1);
    expect(r.vx).toBeCloseTo(-100);
  });
});

describe('integration safety', () => {
  it('does not tunnel: a max-power cue ball always hits the ball in front of it', () => {
    for (const gap of [40, 150, 333, 301.7]) {
      const balls = [mk(0, 60, 200), mk(1, 60 + gap, 200)];
      const { report } = simulateShot(balls, { angle: 0, power: 1, spin: 0 });
      expect(report.firstHit).toBe(1);
    }
  });

  it('does not tunnel through a thin line of balls at max power', () => {
    const balls = [mk(0, 60, 200), mk(1, 300, 190), mk(2, 330, 210), mk(3, 360, 200)];
    const { report } = simulateShot(balls, { angle: 0, power: 1, spin: 0 });
    expect(report.firstHit).not.toBeNull();
  });

  it('keeps every ball on the table through a max-power break', () => {
    const balls: Ball[] = [mk(0, 200, 200, MAX_SPEED, 30)];
    for (let i = 0; i < 6; i++) balls.push(mk(i + 1, 500 + (i % 3) * 21, 170 + Math.floor(i / 3) * 21 + (i % 3) * 5));
    const ev: SimEvent[] = [];
    for (let s = 0; s < 4000; s++) {
      stepWorld(balls, ev);
      for (const b of balls) {
        if (b.pocketed) continue;
        expect(b.x).toBeGreaterThanOrEqual(BALL_R - 1e-6);
        expect(b.x).toBeLessThanOrEqual(TABLE_W - BALL_R + 1e-6);
        expect(b.y).toBeGreaterThanOrEqual(BALL_R - 1e-6);
        expect(b.y).toBeLessThanOrEqual(TABLE_H - BALL_R + 1e-6);
      }
    }
  });

  it('is deterministic for identical inputs', () => {
    const balls = [mk(0, 200, 200), mk(1, 500, 190), mk(2, 520, 215), mk(3, 540, 180)];
    const shot = { angle: 0.02, power: 0.9, spin: 0.4 };
    const a = simulateShot(balls, shot);
    const b = simulateShot(balls, shot);
    expect(a.balls).toEqual(b.balls);
    expect(a.steps).toBe(b.steps);
  });

  it('rolling friction brings a ball to rest', () => {
    const { balls, steps } = simulateShot([mk(0, 100, 200)], { angle: 0, power: 0.3, spin: 0 });
    expect(balls[0]!.vx).toBe(0);
    expect(steps).toBeLessThan(25 * 240);
  });
});

describe('pockets', () => {
  it('captures a ball rolling into a corner pocket', () => {
    const balls = [mk(0, 100, 100, -200, -200)];
    const ev: SimEvent[] = [];
    for (let s = 0; s < 600 && !balls[0]!.pocketed; s++) stepWorld(balls, ev);
    expect(balls[0]!.pocketed).toBe(true);
    expect(ev.some((e) => e.t === 'pot' && e.pocket === 0)).toBe(true);
  });

  it('captures into the side pocket and reports the pocket centre', () => {
    const balls = [mk(1, 400, 80, 0, -250)];
    const ev: SimEvent[] = [];
    for (let s = 0; s < 600 && !balls[0]!.pocketed; s++) stepWorld(balls, ev);
    const pot = ev.find((e) => e.t === 'pot');
    expect(pot).toMatchObject({ t: 'pot', id: 1, pocket: 1, x: POCKETS[1]!.x, y: POCKETS[1]!.y });
  });

  it('does not capture a ball that passes outside the jaw radius', () => {
    const balls = [mk(1, 250, 60, 400, 0)];
    const ev: SimEvent[] = [];
    for (let s = 0; s < 300; s++) stepWorld(balls, ev);
    expect(balls[0]!.pocketed).toBe(false);
  });

  it('top spin follows through and back spin draws back after contact', () => {
    const run = (spin: number): number => {
      const balls = [mk(0, 200, 200), mk(1, 300, 200)];
      return simulateShot(balls, { angle: 0, power: 0.5, spin }).balls[0]!.x;
    };
    expect(run(1)).toBeGreaterThan(run(0) + 20);
    expect(run(-1)).toBeLessThan(run(0) - 20);
  });
});
