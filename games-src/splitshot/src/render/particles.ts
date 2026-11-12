// Fixed-size particle pool (typed arrays, no per-frame allocation). Render-only: never feeds the sim.
import { CONFIG } from '../config';

export const enum Kind { Shard, Spark, Ring, Mote, Confetti }

export class Particles {
  private readonly cap = CONFIG.fx.maxParticles;
  private budget: number;
  private readonly x = new Float32Array(this.cap);
  private readonly y = new Float32Array(this.cap);
  private readonly vx = new Float32Array(this.cap);
  private readonly vy = new Float32Array(this.cap);
  private readonly life = new Float32Array(this.cap);
  private readonly max = new Float32Array(this.cap);
  private readonly size = new Float32Array(this.cap);
  private readonly grow = new Float32Array(this.cap);
  private readonly rot = new Float32Array(this.cap);
  private readonly kind = new Uint8Array(this.cap);
  private readonly color: string[] = new Array<string>(this.cap).fill('#fff');
  count = 0;

  constructor(factor = 1) { this.budget = Math.max(1, Math.round(this.cap * factor)); }

  setFactor(factor: number): void { this.budget = Math.max(1, Math.round(this.cap * factor)); }
  get limit(): number { return this.budget; }

  clear(): void { this.count = 0; }

  spawn(kind: Kind, x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, grow = 0): boolean {
    if (this.count >= this.budget) return false;
    const i = this.count++;
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.grow[i] = grow;
    this.rot[i] = x * 0.37; this.kind[i] = kind; this.color[i] = color;
    return true;
  }

  update(dt: number): void {
    let i = 0;
    while (i < this.count) {
      this.life[i] = (this.life[i] as number) - dt;
      if ((this.life[i] as number) <= 0) { this.remove(i); continue; }
      const k = this.kind[i] as Kind;
      if (k === Kind.Shard || k === Kind.Confetti) this.vy[i] = (this.vy[i] as number) + 380 * dt;
      else if (k === Kind.Mote) this.vy[i] = (this.vy[i] as number) - 10 * dt;
      if (k !== Kind.Ring) {
        this.vx[i] = (this.vx[i] as number) * (1 - 1.6 * dt);
        this.x[i] = (this.x[i] as number) + (this.vx[i] as number) * dt;
        this.y[i] = (this.y[i] as number) + (this.vy[i] as number) * dt;
      }
      this.size[i] = Math.max(0, (this.size[i] as number) + (this.grow[i] as number) * dt);
      this.rot[i] = (this.rot[i] as number) + dt * 6;
      i++;
    }
  }

  private remove(i: number): void {
    const last = --this.count;
    if (i === last) return;
    for (const a of [this.x, this.y, this.vx, this.vy, this.life, this.max, this.size, this.grow, this.rot, this.kind] as const) a[i] = a[last] as number;
    this.color[i] = this.color[last] as string;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.count; i++) {
      const t = (this.life[i] as number) / (this.max[i] as number);
      const x = this.x[i] as number, y = this.y[i] as number, s = this.size[i] as number;
      const k = this.kind[i] as Kind;
      ctx.fillStyle = this.color[i] as string;
      ctx.strokeStyle = this.color[i] as string;
      if (k === Kind.Ring) {
        ctx.globalAlpha = Math.min(1, t * 1.3) * 0.9; ctx.lineWidth = Math.max(0.6, 3 * t);
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke();
      } else if (k === Kind.Confetti) {
        ctx.globalAlpha = Math.min(1, t * 2);
        ctx.save(); ctx.translate(x, y); ctx.rotate(this.rot[i] as number); ctx.fillRect(-s, -s * 0.5, s * 2, s); ctx.restore();
      } else {
        ctx.globalAlpha = k === Kind.Mote ? t * 0.6 : Math.min(1, t * 1.6);
        ctx.beginPath(); ctx.arc(x, y, s * (k === Kind.Spark ? 0.5 + t * 0.5 : 1), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
