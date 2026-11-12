// Board backdrop, painted once per size into an offscreen canvas: deep night gradient,
// a soft light pool, recessed cell sockets, dust specks and a bevelled frame.
import { CONFIG } from '../config';
import { PLATE, PLATE_EDGE, PLATE_TOP } from './palette';

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function paintSockets(ctx: CanvasRenderingContext2D, cell: number, rows: number): void {
  const inset = cell * 0.06;
  const s = cell - inset * 2;
  for (let x = 0; x < CONFIG.board.cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = x * cell + inset;
      const py = y * cell + inset;
      rr(ctx, px, py, s, s, cell * 0.2);
      const g = ctx.createLinearGradient(0, py, 0, py + s);
      g.addColorStop(0, 'rgba(6,8,22,0.5)');
      g.addColorStop(0.6, 'rgba(6,8,22,0.22)');
      g.addColorStop(1, 'rgba(120,140,255,0.1)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,165,255,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function paintDust(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Deterministic specks (no Math.random) so a resize repaints the same sky.
  let seed = 7;
  const next = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const x = next() * w;
    const y = next() * h;
    const a = 0.05 + next() * 0.16;
    ctx.fillStyle = `rgba(190,200,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + next() * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintPlate(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cell = w / CONFIG.board.cols;
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, PLATE_TOP);
  g.addColorStop(0.55, PLATE);
  g.addColorStop(1, '#12162c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const pool = ctx.createRadialGradient(w * 0.3, h * 0.18, 0, w * 0.3, h * 0.18, Math.max(w, h) * 0.7);
  pool.addColorStop(0, 'rgba(120,150,255,0.22)');
  pool.addColorStop(1, 'rgba(120,150,255,0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, w, h);
  paintDust(ctx, w, h);
  paintSockets(ctx, cell, Math.round(h / cell));
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  // Bevelled frame: bright top edge, dark bottom edge.
  const e = ctx.createLinearGradient(0, 0, 0, h);
  e.addColorStop(0, 'rgba(190,205,255,0.55)');
  e.addColorStop(0.5, PLATE_EDGE);
  e.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.strokeStyle = e;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
}
