// Canvas board view: owns the canvas, the animation loop and hit-testing.
import type { Board, ClearResult, Pt } from '../board';
import { CONFIG } from '../config';
import { drawDisc, drawFloatText, drawPlate, drawRing, drawShard, drawShock, drawSpark } from './draw';
import { setRenderScale } from './discArt';
import { DISC_COLOURS } from './palette';
import { SpriteLayer } from './sprites';

const DPR_CAP = 2;
const NUDGE_S = 0.28;

export class BoardView {
  readonly layer = new SpriteLayer();
  private ctx: CanvasRenderingContext2D;
  private cell = 40;
  private hover: readonly Pt[] = [];
  private cursor: Pt | null = null;
  private assist = false;
  private plate: HTMLCanvasElement | null = null;
  private sweep = -1;
  private nudged: { p: Pt; age: number } | null = null;
  private raf = 0;
  private last = 0;
  private rows = CONFIG.board.rows;
  private cols = CONFIG.board.cols;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  setReduced(on: boolean): void {
    this.layer.reduced = on;
  }
  setAssist(on: boolean): void {
    this.assist = on;
    this.invalidate();
  }
  setHover(group: readonly Pt[]): void {
    this.hover = group;
    this.invalidate();
  }
  /** Wiggle one disc sideways (a click that cleared nothing). No-op under Reduce motion. */
  nudge(p: Pt): void {
    if (this.layer.reduced) return;
    this.nudged = { p, age: 0 };
    this.invalidate();
  }
  setCursor(p: Pt | null): void {
    this.cursor = p;
    this.invalidate();
  }

  reset(board: Board, instant = false): void {
    this.layer.reset(board, instant || this.layer.reduced);
    this.hover = [];
    this.sweep = this.layer.reduced ? -1 : 0;
    this.invalidate();
  }
  applyClear(res: ClearResult, points: number): void {
    this.hover = [];
    this.layer.applyClear(res, points);
    this.invalidate();
  }
  applyRise(x: number, colours: readonly number[]): void {
    this.layer.applyRise(x, colours);
    this.invalidate();
  }

  /** Canvas-relative pixel to board cell (y counts up from the floor). */
  cellFromPoint(clientX: number, clientY: number): Pt | null {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - r.left) / r.width) * this.cols);
    const y = Math.floor(((r.bottom - clientY) / r.height) * this.rows);
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows ? { x, y } : null;
  }

  /** Client-space centre of a cell (used by tests and keyboard focus hints). */
  cellCentre(p: Pt): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + ((p.x + 0.5) / this.cols) * r.width, y: r.bottom - ((p.y + 0.5) / this.rows) * r.height };
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cell = w / this.cols;
    setRenderScale(dpr);
    this.plate = this.bakePlate(w, h, dpr);
    this.invalidate();
  }

  private bakePlate(w: number, h: number, dpr: number): HTMLCanvasElement | null {
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    const g = c.getContext('2d');
    if (!g) return null;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlate(g, w, h);
    return c;
  }

  invalidate(): void {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private frame(now: number): void {
    this.raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.layer.update(dt);
    if (this.sweep >= 0) this.sweep = this.sweep + dt * 1000 > CONFIG.fx.sweepMs ? -1 : this.sweep + dt * 1000;
    if (this.nudged) this.nudged = this.nudged.age + dt > NUDGE_S ? null : { p: this.nudged.p, age: this.nudged.age + dt };
    this.paint();
    if (this.layer.busy || this.nudged || this.sweep >= 0) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private toPx(x: number, y: number): { x: number; y: number } {
    return { x: (x + 0.5) * this.cell, y: (this.rows - y - 0.5) * this.cell };
  }

  private paint(): void {
    const { ctx, cell } = this;
    const pw = this.cols * cell;
    const ph = this.rows * cell;
    if (this.plate) ctx.drawImage(this.plate, 0, 0, pw, ph);
    else drawPlate(ctx, pw, ph);
    const lit = new Set(this.hover.map((p) => p.x * 100 + p.y));
    const radius = cell * 0.43;
    for (const [x, col] of this.layer.grid.entries()) {
      for (const [y, s] of col.entries()) {
        if (!s) continue;
        const on = lit.has(x * 100 + y);
        const p = this.toPx(s.x, s.y);
        p.x += this.wobble(x, y) * cell * 0.12;
        drawDisc(ctx, p.x, p.y, radius, { colour: s.colour, scale: on ? CONFIG.fx.hoverScale : 1, alpha: 1, assist: this.assist, lit: on });
      }
    }
    this.paintFx(radius);
    this.paintSweep(pw, ph);
    this.paintCursor(radius);
  }

  private wobble(x: number, y: number): number {
    const n = this.nudged;
    if (!n || n.p.x !== x || n.p.y !== y) return 0;
    return Math.sin((n.age / NUDGE_S) * Math.PI * 4) * (1 - n.age / NUDGE_S);
  }

  private paintFx(radius: number): void {
    const { ctx } = this;
    const fx = CONFIG.fx;
    for (const s of this.layer.popping) {
      const t = Math.min(1, s.popAge / fx.popMs);
      const p = this.toPx(s.x, s.y);
      drawDisc(ctx, p.x, p.y, radius, { colour: s.colour, scale: 1 + t * 0.4, alpha: 1 - t * t, assist: false, lit: false, flash: Math.max(0, 1 - t * 2.2) });
    }
    for (const r of this.layer.rings) {
      const p = this.toPx(r.x, r.y);
      drawShock(ctx, p.x, p.y, radius, r.age / fx.ringMs, DISC_COLOURS[r.colour] ?? '#fff');
    }
    for (const q of this.layer.particles) {
      const p = this.toPx(q.x, q.y);
      const colour = DISC_COLOURS[q.colour] ?? '#fff';
      const a = Math.min(1, q.life * 2);
      if (q.kind === 1) drawShard(ctx, p.x, p.y, q.size * this.cell, q.rot, a, colour);
      else drawSpark(ctx, p.x, p.y, q.size * this.cell, a, colour);
    }
    for (const f of this.layer.floaters) {
      const t = f.age / fx.floatMs;
      const p = this.toPx(f.x, f.y);
      const pop = 1 + Math.max(0, 0.35 - t * 2) * 1.2;
      drawFloatText(ctx, f.text, p.x, p.y - t * this.cell, 1 - t * t, Math.max(16, this.cell * 0.5) * pop);
    }
  }

  /** One slow diagonal glint across the board after a new game starts. */
  private paintSweep(w: number, h: number): void {
    if (this.sweep < 0) return;
    const t = this.sweep / CONFIG.fx.sweepMs;
    const { ctx } = this;
    const x = -w * 0.4 + t * w * 1.8;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x - w * 0.15, 0, x + w * 0.15, h * 0.4);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private paintCursor(radius: number): void {
    if (!this.cursor) return;
    const p = this.toPx(this.cursor.x, this.cursor.y);
    drawRing(this.ctx, p.x, p.y, radius + 4, '#ffffff');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
  }
}
