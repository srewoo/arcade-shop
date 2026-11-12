// Particles, skid marks and screen shake. Respect reduce motion by scaling counts and disabling shake.
import { CONFIG } from '../config';
import { createRng } from '../rng';
import { PAL } from './palette';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color?: string;
  size?: number;
  kind: 'spark' | 'smoke' | 'confetti';
  rot: number;
  vr: number;
}
interface Skid { ax: number; ay: number; bx: number; by: number }

/** Particle count after Reduce motion (<= 40%). */
export const scaledCount = (n: number, reduced: boolean): number => Math.round(n * (reduced ? 0.4 : 1));

export class Fx {
  private sparks: Spark[] = [];
  private skids: Skid[] = [];
  private shakeLeft = 0;
  private readonly rng = createRng(1234);
  reduced = false;

  burst(x: number, y: number, strength: number): void {
    const base = CONFIG.fx.particleBase + Math.round(strength * 3);
    const n = scaledCount(base, this.reduced);
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(1.5, 5 + strength);
      const life = this.rng.range(0.25, 0.5);
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, kind: 'spark', rot: 0, vr: 0 });
    }
    for (let i = 0; i < scaledCount(5, this.reduced); i++) this.smoke(x, y, 0.3 + strength * 0.05);
    if (!this.reduced) this.shakeLeft = CONFIG.fx.shakeMs / 1000;
  }

  /** A grey dust/smoke puff that drifts and grows. */
  smoke(x: number, y: number, size = 0.35): void {
    const a = this.rng.range(0, Math.PI * 2);
    const sp = this.rng.range(0.2, 1);
    const life = this.rng.range(0.6, 1.1);
    this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, size, kind: 'smoke', rot: 0, vr: 0 });
  }

  /** Celebration burst from the bay when a park lands: tumbling ribbons plus a ring of stars. */
  confetti(x: number, y: number, count = 46): void {
    const n = scaledCount(count, this.reduced);
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const sp = this.rng.range(2, 8);
      const color = PAL.confetti[this.rng.int(PAL.confetti.length)];
      const life = this.rng.range(0.7, 1.3);
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life, max: life, color, size: this.rng.range(0.16, 0.3), kind: 'confetti', rot: this.rng.range(0, 6), vr: this.rng.range(-9, 9) });
    }
  }

  /** Tyre mark between two wheel positions. Oldest marks are dropped past the configured cap. */
  skid(ax: number, ay: number, bx: number, by: number): void {
    this.skids.push({ ax, ay, bx, by });
    if (this.skids.length > CONFIG.fx.skidMarks) this.skids.shift();
  }

  update(dt: number): void {
    this.shakeLeft = Math.max(0, this.shakeLeft - dt);
    const drag = Math.pow(0.04, dt);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const k = s.kind === 'smoke' ? Math.pow(0.1, dt) : drag;
      s.vx *= k;
      s.vy *= k;
      s.rot += s.vr * dt;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }

  shake(): { x: number; y: number } {
    if (this.shakeLeft <= 0 || this.reduced) return { x: 0, y: 0 };
    const k = (this.shakeLeft / (CONFIG.fx.shakeMs / 1000)) * 4;
    return { x: (this.rng.next() - 0.5) * k, y: (this.rng.next() - 0.5) * k };
  }

  clear(): void {
    this.sparks = [];
    this.skids = [];
    this.shakeLeft = 0;
  }

  /** Tyre marks, drawn on the ground before the vehicles. */
  drawUnder(ctx: CanvasRenderingContext2D): void {
    if (this.skids.length === 0) return;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.2;
    const n = this.skids.length;
    for (let i = 0; i < n; i++) {
      const s = this.skids[i] as Skid;
      ctx.strokeStyle = `rgba(8,10,14,${0.1 + 0.3 * (i / n)})`;
      ctx.beginPath();
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.bx, s.by);
      ctx.stroke();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const s of this.sparks) {
      const k = Math.max(0, s.life / s.max);
      if (s.kind === 'smoke') {
        const r = (s.size ?? 0.3) * (1.6 - k * 0.9);
        ctx.globalAlpha = k * 0.35;
        ctx.fillStyle = '#d5dae2';
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'confetti') {
        const z = s.size ?? 0.2;
        ctx.globalAlpha = Math.min(1, s.life * 3);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color ?? PAL.spark;
        ctx.scale(1, Math.abs(Math.cos(s.rot * 1.7)) * 0.7 + 0.3);
        ctx.fillRect(-z, -z * 0.4, z * 2, z * 0.8);
        ctx.restore();
      } else {
        ctx.globalAlpha = Math.min(1, s.life * 3);
        ctx.strokeStyle = s.color ?? PAL.spark;
        ctx.lineWidth = 0.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.04, s.y - s.vy * 0.04);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(s.x - 0.04, s.y - 0.04, 0.08, 0.08);
      }
    }
    ctx.globalAlpha = 1;
  }
}
