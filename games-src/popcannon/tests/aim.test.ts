import { describe, expect, it } from 'vitest';
import { MAX_ANGLE, MAX_X, MIN_X, angleToPoint, clampAngle, dirFromAngle, reflectX, stepBall, traceShot } from '../src/aim';
import { SHOOTER, createGrid, cellCenter, setCell } from '../src/hex';

describe('aim maths', () => {
  it('clamps the angle', () => {
    expect(clampAngle(3)).toBe(MAX_ANGLE);
    expect(clampAngle(-3)).toBe(-MAX_ANGLE);
    expect(clampAngle(0.2)).toBe(0.2);
  });
  it('angle 0 points straight up, positive leans right', () => {
    expect(dirFromAngle(0).x).toBeCloseTo(0);
    expect(dirFromAngle(0).y).toBeCloseTo(-1);
    expect(dirFromAngle(0.5).x).toBeGreaterThan(0);
  });
  it('angleToPoint aims at a point', () => {
    expect(angleToPoint(SHOOTER.x, 0)).toBeCloseTo(0);
    expect(angleToPoint(SHOOTER.x + 100, SHOOTER.y - 100)).toBeCloseTo(Math.PI / 4);
  });
  it('reflects off the right wall, mirroring the overshoot', () => {
    const r = reflectX(MAX_X + 5, 0.6);
    expect(r.x).toBe(MAX_X - 5);
    expect(r.vx).toBe(-0.6);
    expect(r.bounced).toBe(true);
  });
  it('reflects off the left wall and leaves in-range values alone', () => {
    expect(reflectX(MIN_X - 2, -1).x).toBe(MIN_X + 2);
    expect(reflectX(100, 1)).toEqual({ x: 100, vx: 1, bounced: false });
  });
  it('stepBall keeps speed and bounces', () => {
    const b = { x: MAX_X - 1, y: 300, vx: 0.8, vy: -0.6 };
    expect(stepBall(b, 4)).toBe(true);
    expect(b.vx).toBeCloseTo(-0.8);
    expect(b.x).toBeLessThan(MAX_X);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(1);
  });
  it('trace of an empty board reaches the ceiling, with one bounce for a wide angle', () => {
    const straight = traceShot(createGrid(0), 0, 1);
    expect(straight.bounces).toBe(0);
    expect(straight.end.x).toBeCloseTo(SHOOTER.x);
    const wide = traceShot(createGrid(0), (70 * Math.PI) / 180, 1);
    expect(wide.bounces).toBeGreaterThanOrEqual(1);
    expect(wide.points.length).toBeGreaterThan(2);
  });
  it('trace stops at the first bubble in the way', () => {
    const grid = createGrid(0);
    const c = cellCenter(8, 5, 0);
    setCell(grid, 8, 5, { kind: 'normal', color: 1 });
    const t = traceShot(grid, Math.atan2(c.x - SHOOTER.x, SHOOTER.y - c.y), 1);
    expect(t.end.y).toBeGreaterThan(c.y);
    expect(Math.hypot(t.end.x - c.x, t.end.y - c.y)).toBeLessThan(40);
  });
});
