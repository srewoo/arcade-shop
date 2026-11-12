// Procedural terrarium background: level-tinted gradient, drifting light motes,
// glass glare and a pebble bed. No assets. The sky and the glass box are static,
// so they are rendered once per hue bucket / layout into offscreen canvases and
// blitted each frame; only the motes move.
import { levelHue } from './palette';
import type { Box } from './layout';
import { paintGlass } from './glassBox';
import { paintScenery } from './terrarium';

interface Mote { x: number; y: number; r: number; speed: number; phase: number }

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w));
  cv.height = Math.max(1, Math.round(h));
  return cv;
};

export class Background {
  private hue = levelHue(1);
  private motes: Mote[] = [];
  private t = 0;
  private sky: { cv: HTMLCanvasElement; key: string } | null = null;
  private glass: { cv: HTMLCanvasElement; key: string; ox: number; oy: number } | null = null;
  private scenery: { cv: HTMLCanvasElement; key: string } | null = null;
  private moteSprite: { cv: HTMLCanvasElement; key: number } | null = null;
  drift = true;
  /** Times the cached layers were rebuilt (debug/perf visibility). */
  rebuilds = 0;

  constructor() {
    let a = 12345;
    const rnd = (): number => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 9; i++) this.motes.push({ x: rnd(), y: rnd(), r: 0.12 + rnd() * 0.22, speed: 0.02 + rnd() * 0.05, phase: rnd() * 6.28 });
  }

  update(dt: number, level: number): void {
    this.t += this.drift ? dt : 0;
    const target = levelHue(level);
    let diff = ((target - this.hue + 540) % 360) - 180; // shortest way round
    diff *= Math.min(1, dt * 1.2);
    this.hue = (this.hue + diff + 360) % 360;
  }

  private bucket(): number {
    return Math.round(this.hue);
  }

  private buildSky(W: number, H: number): HTMLCanvasElement {
    const scale = 0.25; // a smooth gradient survives 4x upscaling
    const cv = makeCanvas(W * scale, H * scale);
    const c = cv.getContext('2d') as CanvasRenderingContext2D;
    const h = this.bucket();
    const g = c.createLinearGradient(0, 0, cv.width * 0.3, cv.height);
    g.addColorStop(0, `hsl(${h} 42% 24%)`);
    g.addColorStop(0.55, `hsl(${(h + 30) % 360} 46% 14%)`);
    g.addColorStop(1, `hsl(${(h + 60) % 360} 50% 8%)`);
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    this.rebuilds++;
    return cv;
  }

  private buildMote(): HTMLCanvasElement {
    const cv = makeCanvas(64, 64);
    const c = cv.getContext('2d') as CanvasRenderingContext2D;
    const h = (this.bucket() + 20) % 360;
    const rg = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, `hsla(${h} 80% 70% / 0.16)`);
    rg.addColorStop(1, `hsla(${h} 80% 70% / 0)`);
    c.fillStyle = rg;
    c.fillRect(0, 0, 64, 64);
    return cv;
  }

  /** Scenery sits between the sky and the glass; `well`/`cell` keep it out of the playfield. */
  drawScenery(c: CanvasRenderingContext2D, W: number, H: number, well: Box, cell: number): void {
    const key = `${this.bucket()}:${Math.round(W)}x${Math.round(H)}:${well.x.toFixed(0)},${well.y.toFixed(0)},${cell.toFixed(1)}`;
    if (!this.scenery || this.scenery.key !== key) {
      const k = Math.min(1, Math.sqrt(2_500_000 / (W * H)));
      const cv = makeCanvas(W * k, H * k);
      const g = cv.getContext('2d') as CanvasRenderingContext2D;
      g.scale(k, k);
      paintScenery(g, W, H, this.bucket(), well, cell);
      this.scenery = { cv, key };
      this.rebuilds++;
    }
    c.drawImage(this.scenery.cv, 0, 0, W, H);
  }

  draw(c: CanvasRenderingContext2D, W: number, H: number): void {
    const b = this.bucket();
    const key = `${b}:${Math.round(W)}x${Math.round(H)}`;
    if (!this.sky || this.sky.key !== key) this.sky = { cv: this.buildSky(W, H), key };
    c.drawImage(this.sky.cv, 0, 0, W, H);
    if (!this.moteSprite || this.moteSprite.key !== b) this.moteSprite = { cv: this.buildMote(), key: b };
    for (const m of this.motes) {
      const x = (m.x + Math.sin(this.t * m.speed + m.phase) * 0.12) * W;
      const y = (m.y + Math.cos(this.t * m.speed * 0.8 + m.phase) * 0.1) * H;
      const r = m.r * Math.max(W, H) * 0.5;
      c.drawImage(this.moteSprite.cv, x - r, y - r, r * 2, r * 2);
    }
  }

  /** Glass box around the well plus a pebble bed underneath (cached). */
  drawGlass(c: CanvasRenderingContext2D, well: Box, cell: number, dpr: number): void {
    const pad = cell * 0.18;
    const key = `${well.x.toFixed(1)},${well.y.toFixed(1)},${well.w.toFixed(1)},${well.h.toFixed(1)},${cell.toFixed(2)},${this.bucket()},${dpr}`;
    if (!this.glass || this.glass.key !== key) {
      const ox = well.x - pad - 4;
      const oy = well.y - pad - 4 - cell * 0.4;
      const w = well.w + pad * 2 + 8;
      const h = well.h + cell * 1.1 + pad + 8 + cell * 0.4;
      const cv = makeCanvas(w * dpr, h * dpr);
      const g = cv.getContext('2d') as CanvasRenderingContext2D;
      g.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
      paintGlass(g, well, cell, this.bucket());
      this.glass = { cv, key, ox, oy };
      this.rebuilds++;
    }
    c.drawImage(this.glass.cv, this.glass.ox, this.glass.oy, this.glass.cv.width / dpr, this.glass.cv.height / dpr);
  }
}
