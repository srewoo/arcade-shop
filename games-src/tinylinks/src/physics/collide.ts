import { CONFIG } from '../config';
import { closestOnSegment } from './geometry';
import type { Vec } from './types';

export interface Ball { x: number; y: number; vx: number; vy: number; px: number; py: number; roll: number }

const q: Vec = { x: 0, y: 0 };

/**
 * Push the ball out of a (possibly moving) segment and reflect its relative velocity.
 * `R` is the contact distance from the segment centre line. Returns the impact speed, 0 for none.
 */
export function collideSegment(
  b: Ball, ax: number, ay: number, bx: number, by: number, R: number, e: number, mvx = 0, mvy = 0,
): number {
  const d2 = closestOnSegment(b.x, b.y, ax, ay, bx, by, q);
  if (d2 >= R * R) return 0;
  const d = Math.sqrt(d2);
  let nx: number;
  let ny: number;
  if (d < 1e-6) {
    const l = Math.hypot(bx - ax, by - ay) || 1;
    nx = -(by - ay) / l;
    ny = (bx - ax) / l;
  } else {
    nx = (b.x - q.x) / d;
    ny = (b.y - q.y) / d;
  }
  b.x = q.x + nx * R;
  b.y = q.y + ny * R;
  const rvx = b.vx - mvx;
  const rvy = b.vy - mvy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return 0;
  const rest = -vn < CONFIG.wall.softBelow ? CONFIG.wall.softRestitution : e;
  b.vx -= (1 + rest) * vn * nx;
  b.vy -= (1 + rest) * vn * ny;
  return -vn;
}
