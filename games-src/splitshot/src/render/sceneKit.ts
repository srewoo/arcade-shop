// Shared scenery helpers: the scene context, ridgelines, glows, stars.
import type { ThemeArt } from './themes';

export interface Scene {
  ctx: CanvasRenderingContext2D;
  x0: number; x1: number; y0: number; y1: number;
  art: ThemeArt;
  rnd: () => number;
}

/** Filled smooth ridge from the left to the right edge, bottom at `bottom`. */
export function ridge(sc: Scene, base: number, amp: number, freq: number, phase: number, fill: string | CanvasGradient, bottom: number, rim?: string): void {
  const { ctx, x0, x1 } = sc;
  ctx.beginPath();
  ctx.moveTo(x0, bottom);
  const step = 8;
  for (let x = x0; x <= x1 + step; x += step) {
    const y = base - amp * (0.55 * Math.sin(x * freq + phase) + 0.3 * Math.sin(x * freq * 2.3 + phase * 1.7) + 0.15 * Math.sin(x * freq * 5.1 + phase * 0.6));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(x1 + step, bottom);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (rim) {
    ctx.beginPath();
    for (let x = x0; x <= x1 + step; x += step) {
      const y = base - amp * (0.55 * Math.sin(x * freq + phase) + 0.3 * Math.sin(x * freq * 2.3 + phase * 1.7) + 0.15 * Math.sin(x * freq * 5.1 + phase * 0.6));
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function stars(sc: Scene, count: number, maxY: number): void {
  const { ctx, x0, x1, y0, rnd } = sc;
  for (let i = 0; i < count; i++) {
    const x = x0 + rnd() * (x1 - x0);
    const y = y0 + rnd() * (maxY - y0);
    const r = 0.3 + rnd() * 0.9;
    ctx.globalAlpha = 0.35 + rnd() * 0.6;
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Soft elongated cloud streak. */
export function streak(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.35, y - h * 0.5, w * 0.55, h * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
