// Cosmetic particles: smoke trail and crash sparks. Not part of the sim (uses its own RNG).
import { CONFIG } from '../config';
import { mulberry32 } from '../rng';
import type { Palette } from './view';

interface Particle { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; spark: boolean; tint?: string }

export class Particles {
  private items: Particle[] = [];
  private readonly rnd = mulberry32(0x5eed);
  private skip = false;

  /** Fraction of the particle budget in use (reduced motion cuts it to 40%). */
  constructor(public factor = 1) {}

  get count(): number { return this.items.length; }
  private get limit(): number { return Math.round(CONFIG.fx.maxParticles * this.factor); }

  clear(): void { this.items = []; }

  smoke(x: number, y: number, thrusting: boolean): void {
    this.skip = !this.skip;
    if (this.factor < 1 && this.skip) return;
    const n = thrusting ? 2 : 1;
    for (let i = 0; i < n && this.items.length < this.limit; i++) {
      this.items.push({
        x: x - 6, y: y + (this.rnd() - 0.5) * 4, vx: -10 - this.rnd() * 14, vy: -8 - this.rnd() * 14,
        age: 0, life: 0.7 + this.rnd() * 0.5, size: 3 + this.rnd() * 2, spark: false,
      });
    }
  }

  burst(x: number, y: number, count: number, tint?: string, speed = 220): void {
    const n = Math.round(count * this.factor);
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2;
      const sp = 60 + this.rnd() * speed;
      this.items.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.4 + this.rnd() * 0.5, size: 2 + this.rnd() * 3, spark: true, tint });
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.spark) p.vy += 500 * dt;
    }
    this.items = this.items.filter((p) => p.age < p.life);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, pal: Palette): void {
    for (const p of this.items) {
      if (p.spark) continue;
      const t = p.age / p.life;
      ctx.globalAlpha = 0.5 * (1 - t);
      ctx.fillStyle = pal.smoke;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.size * (1 + t * 1.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.items) {
      if (!p.spark) continue;
      const t = p.age / p.life;
      const r = p.size * (1 - t * 0.5);
      ctx.fillStyle = p.tint ?? pal.flame;
      ctx.globalAlpha = (1 - t) * 0.35;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
