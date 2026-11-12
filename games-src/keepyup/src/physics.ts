// Pure ball maths: hit angle/spin, gravity ramp, wall bounces, miss detection. No DOM, no RNG.
import { CONFIG } from './config';

export interface Ball {
  x: number; y: number; vx: number; vy: number; rot: number; spin: number;
  px: number; py: number; prot: number; // previous step, for render interpolation
  active: boolean; // false while a delayed second ball waits
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function makeBall(x: number, y: number, active = true): Ball {
  return { x, y, vx: 0, vy: 0, rot: 0, spin: 0, px: x, py: y, prot: 0, active };
}

/** Gravity (px/s^2) after `t` seconds of play: ramps up gently, then caps. */
export function gravityAt(t: number): number {
  const g = CONFIG.gravity;
  return Math.min(g.max, g.base + g.ramp * Math.max(0, t));
}

export interface HitResult { vx: number; vy: number; spin: number; offsetX: number; offsetY: number; sweet: boolean }

/** True when a tap at (tx,ty) is close enough to the ball to count. */
export function inReach(b: Ball, tx: number, ty: number): boolean {
  const r = CONFIG.ball.radius * CONFIG.hit.slop;
  return (tx - b.x) ** 2 + (ty - b.y) ** 2 <= r * r;
}

/**
 * Where the ball is struck sets the launch. Tap left of centre -> ball goes right (and
 * back-spins that way); tap lower on the ball -> stronger kick. Offsets are in -1..1.
 */
export function hitResult(b: Ball, tx: number, ty: number): HitResult {
  const h = CONFIG.hit;
  const r = CONFIG.ball.radius;
  const offsetX = clamp((b.x - tx) / r, -1, 1);
  const offsetY = clamp((ty - b.y) / r, -1, 1);
  const kick = h.kick * (h.kickLow + (h.kickSpread * (offsetY + 1)) / 2);
  const vx = clamp(offsetX * h.sideSpeed + b.vx * h.carry, -h.maxVx, h.maxVx);
  return { vx, vy: -kick, spin: -offsetX * h.spinMax, offsetX, offsetY, sweet: Math.abs(offsetX) <= h.sweet };
}

export function applyHit(b: Ball, r: HitResult): void {
  b.vx = r.vx; b.vy = r.vy; b.spin = r.spin;
}

/** One physics step. Returns 'wall' when a side wall was struck, else null. */
export function stepBall(b: Ball, dt: number, g: number, windAx: number, width: number): 'wall' | null {
  b.px = b.x; b.py = b.y; b.prot = b.rot;
  b.vy += g * dt;
  b.vx += (windAx + b.spin * CONFIG.ball.magnus * 10) * dt;
  b.vx = clamp(b.vx, -CONFIG.hit.maxVx * 1.4, CONFIG.hit.maxVx * 1.4);
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.rot += b.spin * dt;
  b.spin *= Math.max(0, 1 - CONFIG.ball.spinDecay * dt);
  const r = CONFIG.ball.radius;
  let wall: 'wall' | null = null;
  if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx) * CONFIG.ball.restitutionWall; b.spin *= -0.6; wall = 'wall'; }
  else if (b.x > width - r) { b.x = width - r; b.vx = -Math.abs(b.vx) * CONFIG.ball.restitutionWall; b.spin *= -0.6; wall = 'wall'; }
  return wall;
}

/** The ball is lost when its lowest point reaches the ground while moving down. */
export function isMiss(b: Ball): boolean {
  return b.y + CONFIG.ball.radius >= CONFIG.world.groundY && b.vy >= 0;
}

/** Height above the ground as 0 (on it) .. 1 (at or above the top of the world). */
export function heightFrac(y: number): number {
  return clamp((CONFIG.world.groundY - CONFIG.ball.radius - y) / CONFIG.world.groundY, 0, 1);
}
