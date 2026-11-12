// Cosmetic simulation: particles, falling bubbles, pops, trail and score popups.
// Every moving item keeps its previous position so the renderer can interpolate.
import { TUNING } from './config';
import { Bubble, H } from './hex';

export interface Particle { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
export interface Faller { x: number; y: number; px: number; py: number; vx: number; vy: number; rot: number; prot: number; vr: number; b: Bubble }
export interface Popup { x: number; y: number; text: string; life: number; max: number; big: boolean }
export interface Pop { x: number; y: number; b: Bubble; life: number; max: number }
export interface TrailPoint { x: number; y: number }
export interface Effects {
  particles: Particle[];
  fallers: Faller[];
  popups: Popup[];
  pops: Pop[];
  trail: TrailPoint[];
  /** Seconds of effect time, drives the damped shake. */
  clock: number;
}

export const newEffects = (): Effects => ({ particles: [], fallers: [], popups: [], pops: [], trail: [], clock: 0 });

const GRAVITY = 1100;

/** In-place filter: keeps order, allocates nothing. */
export function compact<T>(arr: T[], keep: (t: T) => boolean): void {
  let w = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i] as T;
    if (keep(v)) arr[w++] = v;
  }
  arr.length = w;
}

/** A ring of particles with two sizes. */
export function burst(fx: Effects, x: number, y: number, color: string, count: number, rnd: () => number): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.5;
    const s = 70 + rnd() * 130;
    const life = 0.35 + rnd() * 0.3;
    const vx = Math.cos(a) * s;
    const vy = Math.sin(a) * s - 40;
    fx.particles.push({ x, y, px: x, py: y, vx, vy, life, max: life, color, size: i % 2 === 0 ? 2.9 : 1.8 });
  }
}

export function addPop(fx: Effects, b: Bubble, x: number, y: number): void {
  fx.pops.push({ x, y, b, life: TUNING.fx.popSeconds, max: TUNING.fx.popSeconds });
}

export function addFaller(fx: Effects, b: Bubble, x: number, y: number, rnd: () => number): void {
  fx.fallers.push({ x, y, px: x, py: y, vx: (rnd() - 0.5) * 90, vy: -60 - rnd() * 80, rot: 0, prot: 0, vr: (rnd() - 0.5) * 8, b });
}

export function addPopup(fx: Effects, x: number, y: number, text: string, big = false): void {
  fx.popups.push({ x, y, text, life: big ? 1.3 : 0.9, max: big ? 1.3 : 0.9, big });
}

/** Record the ball's position for the fading trail (newest last). */
export function pushTrail(fx: Effects, x: number, y: number): void {
  fx.trail.push({ x, y });
  if (fx.trail.length > TUNING.fx.trailLen) fx.trail.shift();
}

export function updateEffects(fx: Effects, dt: number): void {
  fx.clock += dt;
  for (const p of fx.particles) {
    p.px = p.x;
    p.py = p.y;
    p.life -= dt;
    p.vy += GRAVITY * 0.4 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  compact(fx.particles, (p) => p.life > 0);
  for (const f of fx.fallers) {
    f.px = f.x;
    f.py = f.y;
    f.prot = f.rot;
    f.vy += GRAVITY * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rot += f.vr * dt;
  }
  compact(fx.fallers, (f) => f.y < H + 40);
  for (const p of fx.popups) p.life -= dt;
  compact(fx.popups, (p) => p.life > 0);
  for (const p of fx.pops) p.life -= dt;
  compact(fx.pops, (p) => p.life > 0);
}
