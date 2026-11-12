// Pot sparkles, pocket drops, scratch shake and floating text.
// Reduce motion: no particles, flashes, drops or shake; text stays static.
import { FX } from './config/fx';
import { POCKETS } from './constants';
import type { Tone } from './gameTypes';
import type { Ball } from './physics';
import { makeBall } from './physics';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface FloatText { text: string; tone: Tone; age: number; max: number }
interface Flash { x: number; y: number; age: number; color: string; r0: number; r1: number; max: number }
interface Drop { ball: Ball; tx: number; ty: number; sx: number; sy: number; age: number }

/** Remove items for which `dead` is true, keeping order, without allocating a new array. */
export function compact<T>(arr: T[], dead: (t: T) => boolean): void {
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    const item = arr[r]!;
    if (!dead(item)) arr[w++] = item;
  }
  arr.length = w;
}

export const nearestPocket = (x: number, y: number): { x: number; y: number } => {
  let best = POCKETS[0]!; let bd = Infinity;
  for (const p of POCKETS) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  return best;
};

export class Fx {
  particles: Particle[] = [];
  texts: FloatText[] = [];
  flash: Flash[] = [];
  drops: Drop[] = [];
  shake = 0; // seconds of shake left
  constructor(public reduced = false) {}

  sparkle(x: number, y: number, color: string): void {
    if (this.reduced) return;
    this.flash.push({ x, y, age: 0, color, r0: 12, r1: 38, max: FX.flashSeconds });
    for (let i = 0; i < FX.particles; i++) {
      const a = (i / FX.particles) * Math.PI * 2 + (i % 3) * 0.3;
      const sp = 60 + ((i * 37) % 90);
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.5 + (i % 5) * 0.08,
        color: i % 2 ? color : '#fff6c9', size: 1.5 + (i % 3),
      });
    }
  }

  /** The potted ball shrinks into the nearest pocket. */
  drop(x: number, y: number, id: number): void {
    if (this.reduced) return;
    const p = nearestPocket(x, y);
    this.drops.push({ ball: makeBall(id, x, y), tx: p.x, ty: p.y, sx: x, sy: y, age: 0 });
  }

  /** Ring burst at the cue ball when it is struck; size follows power. */
  strike(x: number, y: number, power: number): void {
    if (this.reduced) return;
    this.flash.push({ x, y, age: 0, color: '#ffffff', r0: 10, r1: 16 + power * 26, max: FX.strikeSeconds });
  }

  scratchShake(): void { if (!this.reduced) this.shake = FX.shakeSeconds; }

  say(text: string, tone: Tone): void {
    this.texts.push({ text, tone, age: 0, max: this.reduced ? FX.textSecondsReduced : FX.textSeconds });
    if (this.texts.length > FX.maxTexts) this.texts.shift();
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= FX.damping; p.vy *= FX.damping;
    }
    compact(this.particles, (p) => p.life >= p.max);
    for (const t of this.texts) t.age += dt;
    compact(this.texts, (t) => t.age >= t.max);
    for (const f of this.flash) f.age += dt;
    compact(this.flash, (f) => f.age >= f.max);
    for (const d of this.drops) d.age += dt;
    compact(this.drops, (d) => d.age >= FX.dropSeconds);
    this.shake = Math.max(0, this.shake - dt);
  }

  clear(): void { this.particles.length = 0; this.texts.length = 0; this.flash.length = 0; this.drops.length = 0; this.shake = 0; }
}
