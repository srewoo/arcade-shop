// Fixed-size particle pool (no per-frame allocation): sparks and shards from zaps and bombs.
import { CONFIG } from '../config';

export type ParticleKind = 'spark' | 'shard';

export class Particles {
  readonly cap: number;
  private readonly x: Float32Array;
  private readonly y: Float32Array;
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly life: Float32Array;
  private readonly max: Float32Array;
  private readonly size: Float32Array;
  private readonly rot: Float32Array;
  private readonly vr: Float32Array;
  private readonly colour: string[];
  private readonly kind: Uint8Array;
  private head = 0;
  private live = 0;

  /** `factor` scales the pool for Reduce motion (0.4 = 40% of the particles). */
  constructor(factor = 1) {
    this.cap = Math.max(1, Math.round(CONFIG.fx.maxParticles * factor));
    const n = this.cap;
    this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    this.life = new Float32Array(n); this.max = new Float32Array(n);
    this.size = new Float32Array(n); this.rot = new Float32Array(n); this.vr = new Float32Array(n);
    this.colour = Array<string>(n).fill('#fff');
    this.kind = new Uint8Array(n);
  }

  get count(): number { return this.live; }

  /** Spawn one particle (positions and speeds in cells, cells/s). Oldest is recycled when full. */
  emit(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, size: number, colour: string, vr = 0): void {
    const i = this.head;
    this.head = (this.head + 1) % this.cap;
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.max[i] = life; this.size[i] = size;
    this.rot[i] = 0; this.vr[i] = vr; this.colour[i] = colour; this.kind[i] = kind === 'spark' ? 0 : 1;
  }

  /** Burst `n` particles outward from a point. */
  burst(x: number, y: number, n: number, speed: number, colour: string, kind: ParticleKind, rnd: () => number): void {
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2;
      const s = speed * (0.4 + rnd() * 0.9);
      this.emit(kind, x, y, Math.cos(a) * s, Math.sin(a) * s - (kind === 'shard' ? speed * 0.25 : 0), 0.35 + rnd() * 0.4, kind === 'spark' ? 0.04 + rnd() * 0.05 : 0.06 + rnd() * 0.07, colour, (rnd() - 0.5) * 14);
    }
  }

  update(dt: number): void {
    let live = 0;
    for (let i = 0; i < this.cap; i++) {
      if ((this.life[i] as number) <= 0) continue;
      this.life[i] = (this.life[i] as number) - dt;
      if ((this.life[i] as number) <= 0) continue;
      live++;
      const grav = this.kind[i] === 1 ? 14 : 3;
      this.vy[i] = (this.vy[i] as number) + grav * dt;
      this.x[i] = (this.x[i] as number) + (this.vx[i] as number) * dt;
      this.y[i] = (this.y[i] as number) + (this.vy[i] as number) * dt;
      this.rot[i] = (this.rot[i] as number) + (this.vr[i] as number) * dt;
    }
    this.live = live;
  }

  /** Draw with additive blending. (ox, oy) is the grid origin in px and cs the cell size. */
  draw(c: CanvasRenderingContext2D, ox: number, oy: number, cs: number): void {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (let i = 0; i < this.cap; i++) {
      const life = this.life[i] as number;
      if (life <= 0) continue;
      const k = life / (this.max[i] as number);
      const px = ox + (this.x[i] as number) * cs, py = oy + (this.y[i] as number) * cs, sz = (this.size[i] as number) * cs;
      c.globalAlpha = Math.min(1, k * 1.6);
      c.fillStyle = c.strokeStyle = this.colour[i] as string;
      if (this.kind[i] === 0) {
        c.lineWidth = Math.max(1, sz * 0.8);
        c.beginPath(); c.moveTo(px, py); c.lineTo(px - (this.vx[i] as number) * cs * 0.045, py - (this.vy[i] as number) * cs * 0.045); c.stroke();
      } else {
        c.save(); c.translate(px, py); c.rotate(this.rot[i] as number);
        c.fillRect(-sz / 2, -sz / 2, sz, sz * 0.7);
        c.restore();
      }
    }
    c.restore();
  }
}
