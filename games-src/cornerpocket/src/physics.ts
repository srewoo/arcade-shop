// Pure 2D ball physics: fixed-step integration, elastic equal-mass collisions,
// cushion bounce, rolling friction and pocket capture. No DOM.
import {
  BALL_E, BALL_R, CUSHION_E, DRAG, POCKETS, ROLL_DECEL, SPIN_GAIN, STEP, STOP_SPEED, TABLE_H, TABLE_W,
} from './constants';

export interface Ball {
  id: number; // 0 = cue ball
  x: number;
  y: number;
  vx: number;
  vy: number;
  pocketed: boolean;
  spin: number; // -1 back .. +1 top, applied after the first ball contact
  spinPending: boolean;
}

export type SimEvent =
  | { t: 'hit'; a: number; b: number; speed: number }
  | { t: 'cushion'; id: number; speed: number }
  | { t: 'pot'; id: number; pocket: number; x: number; y: number };

export const makeBall = (id: number, x: number, y: number): Ball => ({
  id, x, y, vx: 0, vy: 0, pocketed: false, spin: 0, spinPending: false,
});
export const cloneBalls = (balls: readonly Ball[]): Ball[] => balls.map((b) => ({ ...b }));
export const speedOf = (b: Ball): number => Math.hypot(b.vx, b.vy);
export const isMoving = (balls: readonly Ball[]): boolean =>
  balls.some((b) => !b.pocketed && (b.vx !== 0 || b.vy !== 0));

/** Elastic collision of two equal masses. Returns the closing speed along the normal (0 if none). */
export function resolveBalls(a: Ball, b: Ball, restitution = BALL_E, slop = 0): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d >= 2 * BALL_R + slop || d === 0) return 0;
  const nx = dx / d;
  const ny = dy / d;
  const push = (2 * BALL_R - d) / 2;
  a.x -= nx * push; a.y -= ny * push;
  b.x += nx * push; b.y += ny * push;
  const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (closing <= 0) return 0;
  const j = ((1 + restitution) * closing) / 2;
  a.vx -= j * nx; a.vy -= j * ny;
  b.vx += j * nx; b.vy += j * ny;
  return closing;
}

/** Bounce a ball off the four cushions. Returns the impact speed (0 if no contact). */
export function reflectCushions(b: Ball, e = CUSHION_E): number {
  let hit = 0;
  const lo = BALL_R;
  if (b.x < lo) { hit = Math.max(hit, Math.abs(b.vx)); b.x = lo; b.vx = Math.abs(b.vx) * e; }
  else if (b.x > TABLE_W - lo) { hit = Math.max(hit, Math.abs(b.vx)); b.x = TABLE_W - lo; b.vx = -Math.abs(b.vx) * e; }
  if (b.y < lo) { hit = Math.max(hit, Math.abs(b.vy)); b.y = lo; b.vy = Math.abs(b.vy) * e; }
  else if (b.y > TABLE_H - lo) { hit = Math.max(hit, Math.abs(b.vy)); b.y = TABLE_H - lo; b.vy = -Math.abs(b.vy) * e; }
  return hit;
}

function applyFriction(b: Ball, dt: number): void {
  const v = speedOf(b);
  if (v === 0) return;
  const nv = (v - ROLL_DECEL * dt) * (1 - DRAG * dt);
  if (nv < STOP_SPEED) { b.vx = 0; b.vy = 0; return; }
  const k = nv / v;
  b.vx *= k; b.vy *= k;
}

function capture(b: Ball, events: SimEvent[]): boolean {
  for (let i = 0; i < POCKETS.length; i++) {
    const p = POCKETS[i]!;
    if (Math.hypot(b.x - p.x, b.y - p.y) < p.r) {
      b.pocketed = true; b.vx = 0; b.vy = 0;
      events.push({ t: 'pot', id: b.id, pocket: i, x: p.x, y: p.y });
      return true;
    }
  }
  return false;
}

/** Top/back spin: once, right after the cue ball's first ball contact. */
function applySpin(cue: Ball, ux: number, uy: number, closing: number): void {
  cue.spinPending = false;
  if (cue.spin === 0) return;
  const k = cue.spin * SPIN_GAIN * closing;
  cue.vx += ux * k; cue.vy += uy * k;
}

/**
 * Seconds to rewind two overlapping balls so they just touch. Resolving at the true
 * contact point (instead of the penetrated one) keeps the collision normal accurate,
 * which matters for aimed pots at high speed.
 */
export function timeSinceContact(a: Ball, b: Ball): number {
  const dx = b.x - a.x; const dy = b.y - a.y;
  const wx = b.vx - a.vx; const wy = b.vy - a.vy;
  const ww = wx * wx + wy * wy;
  if (ww < 1e-9) return 0;
  const dw = dx * wx + dy * wy;
  const disc = dw * dw - ww * (dx * dx + dy * dy - 4 * BALL_R * BALL_R);
  if (disc < 0) return 0;
  const s = (-dw - Math.sqrt(disc)) / ww; // negative: contact happened in the past
  return s < 0 ? -s : 0;
}

function resolveAtContact(a: Ball, b: Ball): number {
  if (Math.hypot(b.x - a.x, b.y - a.y) >= 2 * BALL_R) return 0;
  const back = timeSinceContact(a, b);
  a.x -= a.vx * back; a.y -= a.vy * back;
  b.x -= b.vx * back; b.y -= b.vy * back;
  const closing = resolveBalls(a, b, BALL_E, 1e-6);
  a.x += a.vx * back; a.y += a.vy * back;
  b.x += b.vx * back; b.y += b.vy * back;
  return closing;
}

function collidePairs(balls: Ball[], events: SimEvent[]): void {
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i]!;
    if (a.pocketed) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j]!;
      if (b.pocketed) continue;
      const cue = a.id === 0 ? a : b.id === 0 ? b : null;
      const sp = cue ? Math.hypot(cue.vx, cue.vy) : 0;
      const ux = cue && sp > 0 ? cue.vx / sp : 0;
      const uy = cue && sp > 0 ? cue.vy / sp : 0;
      const closing = resolveAtContact(a, b);
      if (closing <= 0) continue;
      events.push({ t: 'hit', a: a.id, b: b.id, speed: closing });
      if (cue && cue.spinPending) applySpin(cue, ux, uy, closing);
    }
  }
}

function substepCount(balls: readonly Ball[], dt: number): number {
  let max = 0;
  for (const b of balls) if (!b.pocketed) max = Math.max(max, speedOf(b));
  return Math.max(1, Math.ceil((max * dt) / (BALL_R * 0.4)));
}

/** Advance the world by one fixed STEP (internally sub-divided at high speed so nothing tunnels). */
export function stepWorld(balls: Ball[], events: SimEvent[], dt = STEP): void {
  const n = substepCount(balls, dt);
  const h = dt / n;
  for (let s = 0; s < n; s++) {
    for (const b of balls) {
      if (b.pocketed) continue;
      applyFriction(b, h);
      b.x += b.vx * h; b.y += b.vy * h;
      if (capture(b, events)) continue;
      const hit = reflectCushions(b);
      if (hit > 1) events.push({ t: 'cushion', id: b.id, speed: hit });
    }
    collidePairs(balls, events);
  }
}
