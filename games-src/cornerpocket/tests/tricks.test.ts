import { describe, expect, it } from 'vitest';
import { BALL_R, POCKETS, TABLE_H, TABLE_W } from '../src/constants';
import { rackLayout, eightBallRack, validSpot } from '../src/layouts';
import type { Ball } from '../src/physics';
import { TRICKS, trickBalls, trickStars } from '../src/tricks';

function expectValid(balls: readonly Ball[]): void {
  for (const [i, a] of balls.entries()) {
    expect(a.x).toBeGreaterThanOrEqual(BALL_R);
    expect(a.x).toBeLessThanOrEqual(TABLE_W - BALL_R);
    expect(a.y).toBeGreaterThanOrEqual(BALL_R);
    expect(a.y).toBeLessThanOrEqual(TABLE_H - BALL_R);
    for (const p of POCKETS) expect(Math.hypot(a.x - p.x, a.y - p.y)).toBeGreaterThan(p.r);
    for (const b of balls.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(2 * BALL_R);
  }
  expect(new Set(balls.map((b) => b.id)).size).toBe(balls.length);
}

describe('trick-shot layouts', () => {
  it('has 15 puzzles', () => expect(TRICKS).toHaveLength(15));
  TRICKS.forEach((t, i) => {
    it(`#${i + 1} ${t.name}: balls are on the table and do not overlap`, () => {
      const balls = trickBalls(t);
      expectValid(balls);
      expect(validSpot(balls.filter((b) => b.id !== 0), balls[0]!.x, balls[0]!.y)).toBe(true);
      expect(t.par).toBeGreaterThanOrEqual(t.balls.length > 0 ? 1 : 0);
      expect(t.limit).toBeGreaterThan(t.par);
    });
  });
  it('awards stars by shots used', () => {
    const t = TRICKS[2]!;
    expect(trickStars(t, t.par, true)).toBe(3);
    expect(trickStars(t, t.par + 1, true)).toBe(2);
    expect(trickStars(t, t.limit, true)).toBe(1);
    expect(trickStars(t, t.limit + 1, true)).toBe(0);
    expect(trickStars(t, 1, false)).toBe(0);
  });
});

describe('generated racks', () => {
  it('rack layouts are valid and deterministic', () => {
    for (let r = 1; r <= 12; r++) {
      expectValid(rackLayout(r));
      expect(rackLayout(r)).toEqual(rackLayout(r));
    }
  });
  it('the 8-ball triangle has 15 non-overlapping balls', () => {
    const balls = eightBallRack();
    expect(balls).toHaveLength(16);
    expectValid(balls);
  });
});
