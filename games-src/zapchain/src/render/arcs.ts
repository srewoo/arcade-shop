// Electric arcs that run along a zapped chain, parent to child, travelling outward from the disc
// you clicked. Pooled; the jagged shape is re-rolled from a hash a few times a second (no
// allocation, no Math.random in the frame loop).
import { CONFIG } from '../config';
import type { Kind } from '../model/types';
import { DISC } from './palette';

const SEG = 7;
const FLICKER_HZ = 22;

const hash = (a: number, b: number, c: number): number => {
  const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return s - Math.floor(s) - 0.5;
};

export class Arcs {
  private readonly cap = CONFIG.fx.maxArcs;
  private readonly ax = new Float32Array(this.cap);
  private readonly ay = new Float32Array(this.cap);
  private readonly bx = new Float32Array(this.cap);
  private readonly by = new Float32Array(this.cap);
  private readonly delay = new Float32Array(this.cap);
  private readonly life = new Float32Array(this.cap);
  private readonly age = new Float32Array(this.cap);
  private readonly kind = new Uint8Array(this.cap);
  private readonly power = new Float32Array(this.cap);
  private head = 0;
  private live = 0;

  get count(): number { return this.live; }

  /** Add an arc between two cell centres (grid units). `power` scales width and brightness. */
  add(ax: number, ay: number, bx: number, by: number, delay: number, kind: Kind, power = 1): void {
    const i = this.head;
    this.head = (this.head + 1) % this.cap;
    this.ax[i] = ax; this.ay[i] = ay; this.bx[i] = bx; this.by[i] = by;
    this.delay[i] = delay; this.life[i] = CONFIG.fx.arcLifeSec; this.age[i] = 0; this.kind[i] = kind; this.power[i] = power;
  }

  update(dt: number): void {
    let live = 0;
    for (let i = 0; i < this.cap; i++) {
      if ((this.life[i] as number) <= 0) continue;
      this.age[i] = (this.age[i] as number) + dt;
      if ((this.age[i] as number) - (this.delay[i] as number) >= (this.life[i] as number)) { this.life[i] = 0; continue; }
      live++;
    }
    this.live = live;
  }

  draw(c: CanvasRenderingContext2D, ox: number, oy: number, cs: number, time: number): void {
    if (this.live === 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round'; c.lineJoin = 'round';
    const frame = Math.floor(time * FLICKER_HZ);
    for (let i = 0; i < this.cap; i++) {
      if ((this.life[i] as number) <= 0) continue;
      const t = ((this.age[i] as number) - (this.delay[i] as number)) / (this.life[i] as number);
      if (t < 0) continue;
      this.drawOne(c, i, ox, oy, cs, frame, 1 - t * t);
    }
    c.restore();
  }

  private drawOne(c: CanvasRenderingContext2D, i: number, ox: number, oy: number, cs: number, frame: number, fade: number): void {
    const x0 = ox + ((this.ax[i] as number) + 0.5) * cs, y0 = oy + ((this.ay[i] as number) + 0.5) * cs;
    const x1 = ox + ((this.bx[i] as number) + 0.5) * cs, y1 = oy + ((this.by[i] as number) + 0.5) * cs;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const amp = cs * 0.2 * (this.power[i] as number);
    c.beginPath();
    c.moveTo(x0, y0);
    for (let k = 1; k < SEG; k++) {
      const f = k / SEG;
      const j = hash(i, k, frame) * 2 * amp * Math.sin(f * Math.PI);
      c.lineTo(x0 + dx * f + nx * j, y0 + dy * f + ny * j);
    }
    c.lineTo(x1, y1);
    const col = DISC[this.kind[i] as Kind];
    const p = this.power[i] as number;
    c.globalAlpha = 0.22 * fade; c.strokeStyle = col.glow; c.lineWidth = cs * 0.36 * p; c.stroke();
    c.globalAlpha = 0.7 * fade; c.strokeStyle = col.light; c.lineWidth = cs * 0.13 * p; c.stroke();
    c.globalAlpha = fade; c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, cs * 0.045 * p); c.stroke();
  }
}
