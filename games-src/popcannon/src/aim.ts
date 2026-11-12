// Pure aim and projectile maths: angle clamp, wall reflection, shot tracing.
import { TUNING } from './config';
import { Grid, H, R, SHOOTER, TOP_Y, W, hitsBubble } from './hex';

export const MAX_ANGLE = (TUNING.aim.maxDeg * Math.PI) / 180;
export const MIN_X = R;
export const MAX_X = W - R;
export const SUBSTEP = TUNING.ball.substep;

export interface Vec {
  x: number;
  y: number;
}
export interface Ball extends Vec {
  vx: number;
  vy: number;
}

export const clampAngle = (a: number): number => Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, a));

/** Angle is measured from straight up; positive leans right. */
export function dirFromAngle(a: number): Vec {
  return { x: Math.sin(a), y: -Math.cos(a) };
}

/** Angle from the shooter to a point, clamped to the allowed arc. */
export function angleToPoint(px: number, py: number): number {
  return clampAngle(Math.atan2(px - SHOOTER.x, SHOOTER.y - py));
}

/** Reflect an x position off the side walls. */
export function reflectX(x: number, vx: number, minX = MIN_X, maxX = MAX_X): { x: number; vx: number; bounced: boolean } {
  if (x < minX) return { x: 2 * minX - x, vx: -vx, bounced: true };
  if (x > maxX) return { x: 2 * maxX - x, vx: -vx, bounced: true };
  return { x, vx, bounced: false };
}

/** Move a ball by `dist` pixels along its heading, bouncing off walls. */
export function stepBall(b: Ball, dist: number): boolean {
  const r = reflectX(b.x + b.vx * dist, b.vx);
  b.x = r.x;
  b.vx = r.vx;
  b.y += b.vy * dist;
  return r.bounced;
}

export interface Trace {
  points: Vec[];
  end: Vec;
  bounces: number;
}

/** Follow a shot from the cannon until it hits something (or bounces too often). */
export function traceShot(grid: Grid, angle: number, maxBounces: number): Trace {
  const d = dirFromAngle(angle);
  const ball: Ball = { x: SHOOTER.x, y: SHOOTER.y, vx: d.x, vy: d.y };
  const points: Vec[] = [{ x: ball.x, y: ball.y }];
  let bounces = 0;
  for (let i = 0; i < 4000 && ball.y > TOP_Y && ball.y < H + 50; i++) {
    if (stepBall(ball, SUBSTEP)) {
      points.push({ x: ball.x, y: ball.y });
      if (++bounces > maxBounces) break;
    }
    if (hitsBubble(grid, ball.x, ball.y)) break;
  }
  const end = { x: ball.x, y: ball.y };
  points.push(end);
  return { points, end, bounces };
}
