// Pure bubble physics: gravity, wall/ceiling/floor bounces with size-dependent height, solid rects,
// circle/rect and line/circle overlap, and the split rule. No DOM, no randomness.
import { CONFIG } from '../config';
import type { Bubble, Rect } from './types';

const { w: W, floorY, ceilY } = CONFIG.world;
const G = CONFIG.physics.gravity;

export const radiusOf = (size: number): number => CONFIG.bubble.radius[size] ?? 8;

/** Launch speed that makes a bubble of this size rise exactly `bounceHeight` above where it bounced. */
export const bounceSpeed = (size: number): number => Math.sqrt(2 * G * (CONFIG.bubble.bounceHeight[size] ?? 60));

export const hSpeedOf = (size: number, mul = 1): number => (CONFIG.bubble.hSpeed[size] ?? 80) * mul;

export function makeBubble(id: number, x: number, y: number, size: number, dir: 1 | -1, speedMul = 1): Bubble {
  return { id, x, y, px: x, py: y, vx: dir * hSpeedOf(size, speedMul), vy: 0, size };
}

/** Push a bubble out of a rect and reflect its velocity. Returns true when it touched. */
export function collideRect(b: Bubble, r: Rect): boolean {
  const rad = radiusOf(b.size);
  const cx = Math.min(Math.max(b.x, r.x), r.x + r.w);
  const cy = Math.min(Math.max(b.y, r.y), r.y + r.h);
  let dx = b.x - cx;
  let dy = b.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rad * rad) return false;
  if (d2 === 0) {
    // Centre inside the rect: leave through the nearest face.
    const left = b.x - r.x, right = r.x + r.w - b.x, top = b.y - r.y, bottom = r.y + r.h - b.y;
    const m = Math.min(left, right, top, bottom);
    if (m === top) { dx = 0; dy = -1; b.y = r.y - rad; }
    else if (m === bottom) { dx = 0; dy = 1; b.y = r.y + r.h + rad; }
    else if (m === left) { dx = -1; dy = 0; b.x = r.x - rad; }
    else { dx = 1; dy = 0; b.x = r.x + r.w + rad; }
  } else {
    const d = Math.sqrt(d2);
    dx /= d; dy /= d;
    b.x = cx + dx * rad;
    b.y = cy + dy * rad;
  }
  const speed = hSpeedOf(b.size);
  if (Math.abs(dy) >= Math.abs(dx)) {
    if (dy < 0) { if (b.vy > 0) b.vy = -bounceSpeed(b.size); }
    else if (b.vy < 0) b.vy = Math.abs(b.vy) * 0.5;
  } else {
    b.vx = dx > 0 ? Math.abs(b.vx || speed) : -Math.abs(b.vx || speed);
  }
  return true;
}

/** `floorBounce` is true for any landing (floor, ledge or block top). */
export interface StepOutcome { floorBounce: boolean; hitSolid: boolean }

/** Advance one bubble by `dt` seconds (semi-implicit Euler, fully deterministic). */
export function stepBubble(b: Bubble, dt: number, solids: readonly Rect[]): StepOutcome {
  b.px = b.x; b.py = b.y;
  b.vy += G * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  const rad = radiusOf(b.size);
  const out: StepOutcome = { floorBounce: false, hitSolid: false };
  if (b.x - rad < 0) { b.x = rad; b.vx = Math.abs(b.vx); }
  else if (b.x + rad > W) { b.x = W - rad; b.vx = -Math.abs(b.vx); }
  if (b.y - rad < ceilY) { b.y = ceilY + rad; b.vy = Math.abs(b.vy); }
  const vyIn = b.vy;
  for (const s of solids) if (collideRect(b, s)) out.hitSolid = true;
  if (out.hitSolid && vyIn > 0 && b.vy < 0) out.floorBounce = true;
  if (b.y + rad >= floorY && b.vy > 0) {
    b.y = floorY - rad;
    b.vy = -bounceSpeed(b.size);
    out.floorBounce = true;
  }
  return out;
}

/** Circle against rect overlap (used for the player hit box and pickups). */
export function circleHitsRect(cx: number, cy: number, rad: number, r: Rect): boolean {
  const nx = Math.min(Math.max(cx, r.x), r.x + r.w);
  const ny = Math.min(Math.max(cy, r.y), r.y + r.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < rad * rad;
}

/** Does the vertical line at `lx` (spanning tipY..floor) touch the bubble? */
export function lineHitsBubble(lx: number, tipY: number, halfWidth: number, b: Bubble): boolean {
  const rad = radiusOf(b.size) + halfWidth;
  const cy = Math.min(Math.max(b.y, tipY), floorY);
  return (b.x - lx) ** 2 + (b.y - cy) ** 2 < rad * rad;
}

/** Split rule: size s > 0 becomes two bubbles of size s-1 flying apart; size 0 pops (empty list). */
export function splitChildren(b: Bubble, nextId: () => number, speedMul = 1): Bubble[] {
  if (b.size <= 0) return [];
  const size = b.size - 1;
  const off = radiusOf(size) * 0.7;
  const make = (dir: 1 | -1): Bubble => {
    const c = makeBubble(nextId(), b.x + dir * off, b.y, size, dir, speedMul);
    c.vy = -CONFIG.bubble.splitKick;
    c.px = c.x; c.py = c.y;
    return c;
  };
  return [make(-1), make(1)];
}
