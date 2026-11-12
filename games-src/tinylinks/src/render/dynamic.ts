// Per-frame animated scenery: water shimmer, slope chevrons, moving obstacles, the flag.
import { moverPoly } from '../physics/movers';
import type { HoleDef, MoverDef, Slope, Vec } from '../physics/types';
import { PAL } from './palette';
import { shapeBox, shapeCenter, shapePath } from './paths';

export function drawWaterShimmer(ctx: CanvasRenderingContext2D, hole: HoleDef, t: number, reduced: boolean): void {
  for (const h of hole.hazards ?? []) {
    if (h.kind !== 'water') continue;
    const b = shapeBox(h.shape);
    ctx.save();
    shapePath(ctx, h.shape);
    ctx.clip();
    ctx.lineWidth = 1.3;
    const time = reduced ? 0 : t;
    for (let row = 0; row < b.h; row += 11) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.12 * Math.sin(row + time * 1.3)})`;
      for (let x = 0; x <= b.w; x += 5) {
        const y = b.y + row + Math.sin(x * 0.07 + time * 1.6 + row * 0.5) * 2.2;
        if (x === 0) ctx.moveTo(b.x + x, y); else ctx.lineTo(b.x + x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const sx = b.x + ((i * 53.7 + 17) % b.w);
      const sy = b.y + ((i * 91.3 + 5) % b.h);
      const a = reduced ? 0.5 : Math.max(0, Math.sin(time * 2.2 + i * 1.9));
      ctx.fillStyle = `rgba(255,255,255,${0.75 * a})`;
      ctx.fillRect(sx - 1.5, sy - 0.4, 3, 0.8);
      ctx.fillRect(sx - 0.4, sy - 1.5, 0.8, 3);
    }
    ctx.restore();
  }
}

export function drawSlopeChevrons(ctx: CanvasRenderingContext2D, s: Slope, t: number, reduced: boolean): void {
  const b = shapeBox(s.shape);
  const c = shapeCenter(s.shape);
  const m = Math.hypot(s.ax, s.ay) || 1;
  const ux = s.ax / m;
  const uy = s.ay / m;
  const gap = 34;
  const phase = reduced ? 0 : (t * 26) % gap;
  ctx.save();
  shapePath(ctx, s.shape);
  ctx.clip();
  ctx.translate(c.x, c.y);
  ctx.rotate(Math.atan2(uy, ux));
  const len = Math.hypot(b.w, b.h);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let along = -len / 2; along < len / 2; along += gap) {
    for (let across = -len / 2; across < len / 2; across += 40) {
      const x = along + phase;
      const edge = Math.max(0, 1 - Math.abs(x) / (len / 2));
      ctx.strokeStyle = `rgba(245,255,240,${0.28 + 0.3 * edge})`;
      ctx.beginPath();
      ctx.moveTo(x - 4, across - 7); ctx.lineTo(x + 3, across); ctx.lineTo(x - 4, across + 7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const scratch: Vec[][] = [];

/** Bevelled, striped moving obstacles with a drop shadow. `t` includes the interpolation fraction. */
export function drawMovers(ctx: CanvasRenderingContext2D, defs: readonly MoverDef[], t: number): void {
  defs.forEach((m, i) => {
    const pts = moverPoly(m, t, (scratch[i] ??= []));
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.translate(3.5, 5);
    path4(ctx, pts);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    ctx.translate(-3.5, -5);
    path4(ctx, pts);
    ctx.fillStyle = '#d9573f';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = PAL.wallEdge;
    ctx.stroke();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3.4;
    const [p0, p1, p2] = pts as [Vec, Vec, Vec];
    const long = Math.hypot(p1.x - p0.x, p1.y - p0.y) > Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const ax = long ? p1.x - p0.x : p2.x - p1.x;
    const ay = long ? p1.y - p0.y : p2.y - p1.y;
    const l = Math.hypot(ax, ay) || 1;
    const nx = -ay / l;
    const ny = ax / l;
    const cx = (p0.x + p2.x) / 2;
    const cy = (p0.y + p2.y) / 2;
    for (let k = -l; k < l; k += 12) {
      ctx.beginPath();
      ctx.moveTo(cx + (ax / l) * k - nx * 20, cy + (ay / l) * k - ny * 20);
      ctx.lineTo(cx + (ax / l) * (k + 8) + nx * 20, cy + (ay / l) * (k + 8) + ny * 20);
      ctx.stroke();
    }
    ctx.restore();
    path4(ctx, pts);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,225,205,0.85)';
    ctx.stroke();
    if (m.kind === 'spin') {
      ctx.beginPath(); ctx.arc(m.cx, m.cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3e2c1a'; ctx.fill();
      ctx.beginPath(); ctx.arc(m.cx - 1.5, m.cy - 1.6, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,220,0.8)'; ctx.fill();
    }
  });
}

function path4(ctx: CanvasRenderingContext2D, p: readonly Vec[]): void {
  ctx.beginPath();
  p.forEach((v, i) => (i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y)));
  ctx.closePath();
}

/** Flag on a pole that always stands "up" on screen; `unrotate` cancels the portrait rotation. */
export function drawFlag(ctx: CanvasRenderingContext2D, cup: Vec, t: number, unrotate: number, reduced: boolean): void {
  const h = 46;
  ctx.save();
  ctx.translate(cup.x, cup.y);
  ctx.rotate(unrotate);
  ctx.beginPath(); ctx.moveTo(0.5, 0); ctx.lineTo(13, 4); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h);
  ctx.lineWidth = 1.7; ctx.strokeStyle = PAL.pole; ctx.lineCap = 'round'; ctx.stroke();
  const wave = reduced ? 0 : Math.sin(t * 4.2);
  const w1 = 19 + wave * 1.5;
  ctx.beginPath();
  ctx.moveTo(0.8, -h);
  ctx.bezierCurveTo(w1 * 0.4, -h + 1 + wave, w1 * 0.7, -h - 1 - wave, w1, -h + 3.6);
  ctx.bezierCurveTo(w1 * 0.7, -h + 6.8 - wave, w1 * 0.4, -h + 8.6 + wave, 0.8, -h + 8);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -h, w1, -h + 8);
  g.addColorStop(0, PAL.flagLight); g.addColorStop(1, PAL.flag);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(70,10,8,0.8)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -h - 0.5, 1.5, 0, Math.PI * 2); ctx.fillStyle = '#ffe27a'; ctx.fill();
  ctx.restore();
}
