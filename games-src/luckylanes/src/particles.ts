// Screen-space crash particles in fixed pools (ring-buffer style: no push/shift/splice in the hot loop).
// Pure data + update; the renderer draws them.
import type { Rng } from './rng';
import { TUNING } from './tuning';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  square: boolean;
}

/** Expanding ring flash (skipped entirely under reduced motion). */
export interface Ring {
  active: boolean;
  x: number;
  y: number;
  maxR: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface ParticleSystem {
  /** Fixed pool; `active` marks live entries. */
  readonly items: Particle[];
  readonly rings: Ring[];
  /** 1 normally, lower when reduced motion is requested. */
  intensity: number;
  next: number;
  nextRing: number;
}

export const MAX_PARTICLES = TUNING.juice.particleCap;
const MAX_RINGS = 8;
const SPARK = ['#ffd24a', '#fff4c2', '#ff9d3c', '#ffffff'];
const CONFETTI = ['#ff4d6d', '#4dd2ff', '#ffd24a', '#7dff8a', '#c58bff'];

const blank = (): Particle => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 1, color: '#fff', square: false });
const blankRing = (): Ring => ({ active: false, x: 0, y: 0, maxR: 1, life: 0, maxLife: 1, color: '#fff' });

export const createParticles = (intensity = 1): ParticleSystem => ({
  items: Array.from({ length: MAX_PARTICLES }, blank), rings: Array.from({ length: MAX_RINGS }, blankRing), intensity, next: 0, nextRing: 0,
});

export const liveParticles = (ps: ParticleSystem): number => ps.items.reduce((n, p) => n + (p.active ? 1 : 0), 0);

function add(ps: ParticleSystem, x: number, y: number, vx: number, vy: number, maxLife: number, size: number, color: string, square: boolean): void {
  const p = ps.items[ps.next] as Particle;
  ps.next = (ps.next + 1) % ps.items.length;
  p.active = true;
  p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = 0; p.maxLife = maxLife; p.size = size; p.color = color; p.square = square;
}

/** Number of splinters for a crash; strikes get the big burst. */
export function burstCount(strength: number, intensity: number, strike: boolean): number {
  const cap = strike ? TUNING.juice.burstStrikeMax : TUNING.juice.burstMax;
  return Math.round((strike ? cap : Math.min(cap, 2 + strength / 120)) * intensity);
}

/** Splinters and sparks from a pin crash; `px` is the scale in px per cm. */
export function burst(ps: ParticleSystem, rng: Rng, sx: number, sy: number, strength: number, px: number, strike = false): void {
  const n = burstCount(strength, ps.intensity, strike);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * rng();
    const b = TUNING.juice.burst;
    const v = (b.speedMin + rng() * b.speedRange) * Math.max(0.6, px) * (0.5 + Math.min(1, strength / 600));
    add(ps, sx, sy, Math.cos(a) * v, Math.sin(a) * v, b.lifeMin + rng() * b.lifeRange, b.sizeMin + rng() * b.sizeRange, SPARK[Math.floor(rng() * SPARK.length)] as string, rng() < 0.5);
  }
}

/** One expanding ring flash. No-op when reduced motion lowered the intensity. */
export function ring(ps: ParticleSystem, sx: number, sy: number, maxR: number, color: string): void {
  if (ps.intensity < 1) return;
  const r = ps.rings[ps.nextRing] as Ring;
  ps.nextRing = (ps.nextRing + 1) % ps.rings.length;
  r.active = true; r.x = sx; r.y = sy; r.maxR = maxR; r.life = 0; r.maxLife = TUNING.juice.ringLife; r.color = color;
}

/** Celebration confetti (skipped entirely under reduced motion). */
export function confetti(ps: ParticleSystem, rng: Rng, width: number, height: number): void {
  if (ps.intensity < 1) return;
  for (let i = 0; i < TUNING.juice.confettiCount; i++) {
    add(ps, rng() * width, -10 - rng() * height * 0.2, (rng() - 0.5) * 80, 60 + rng() * 140, 1.6 + rng() * 1.2, 3 + rng() * 4, CONFETTI[Math.floor(rng() * CONFETTI.length)] as string, true);
  }
}

export function updateParticles(ps: ParticleSystem, dt: number): void {
  for (const p of ps.items) {
    if (!p.active) continue;
    p.life += dt;
    if (p.life >= p.maxLife) { p.active = false; continue; }
    p.vy += TUNING.juice.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (const r of ps.rings) {
    if (!r.active) continue;
    r.life += dt;
    if (r.life >= r.maxLife) r.active = false;
  }
}
