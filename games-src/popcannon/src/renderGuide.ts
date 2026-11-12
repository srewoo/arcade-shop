// Aim guide: dotted path, landing ring, ghost outline of what would pop, bomb blast radius.
import { R } from './hex';
import { cellCenter } from './hex';
import { Preview, previewShot } from './preview';
import { RenderOpts } from './renderTypes';
import { Game } from './state';

let cached: { version: number; angle: number; cur: string; preview: Preview } | null = null;

/** Reuses the previous preview while the aim, the board and the loaded bubble are unchanged. */
function previewFor(g: Game): Preview {
  const cur = g.cur ? `${g.cur.kind}${g.cur.color}` : '';
  if (!cached || cached.version !== g.version || cached.angle !== g.angle || cached.cur !== cur) {
    cached = { version: g.version, angle: g.angle, cur, preview: previewShot(g.grid, g.angle, g.cur, 1) };
  }
  return cached.preview;
}

function dots(ctx: CanvasRenderingContext2D, pv: Preview, g: Game, o: RenderOpts): void {
  const gap = 14;
  let carry = g.reduced ? 0 : (o.time * 40) % gap;
  const r = o.highContrast ? 3.2 : 2;
  ctx.fillStyle = o.highContrast ? '#ffffff' : 'rgba(255,255,255,0.85)';
  const pts = pv.trace.points;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (!a || !b) continue;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    for (let d = gap - carry; d < len; d += gap) {
      const px = a.x + ((b.x - a.x) * d) / len;
      const py = a.y + ((b.y - a.y) * d) / len;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.arc(px, py, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    carry = (carry + len) % gap;
  }
}

export function guide(ctx: CanvasRenderingContext2D, g: Game, o: RenderOpts): void {
  const pv = previewFor(g);
  dots(ctx, pv, g, o);
  if (pv.trace.bounces > 1) return;
  ctx.lineWidth = o.highContrast ? 2.5 : 1.5;
  ctx.strokeStyle = o.highContrast ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(pv.trace.end.x, pv.trace.end.y, R * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  ctx.stroke();
  if (!pv.landing) return;
  const land = cellCenter(pv.landing.row, pv.landing.col, g.grid.phase);
  if (pv.bomb) {
    ctx.fillStyle = 'rgba(255,120,60,0.12)';
    ctx.strokeStyle = 'rgba(255,150,80,0.6)';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(land.x, land.y, R * 3.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  for (const p of pv.popped) {
    if (p.row === pv.landing.row && p.col === pv.landing.col) continue;
    const c = cellCenter(p.row, p.col, g.grid.phase);
    ctx.beginPath();
    ctx.arc(c.x, c.y, R + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}
