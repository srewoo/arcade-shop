// Scenery around the course: bushes, rocks and flowers placed with a seeded RNG so each hole is stable.
import { insidePolys, closestOnSegment } from '../physics/geometry';
import { segmentsOf } from '../physics/sim';
import type { HoleDef, Vec } from '../physics/types';
import { PAL } from './palette';
import { rng } from './rng';

function farFromCourse(hole: HoleDef, x: number, y: number, gap: number): boolean {
  if (insidePolys(x, y, hole.walls)) return false;
  const tmp: Vec = { x: 0, y: 0 };
  for (const s of segmentsOf(hole)) if (closestOnSegment(x, y, s.ax, s.ay, s.bx, s.by, tmp) < gap * gap) return false;
  return true;
}

export function drawDecor(ctx: CanvasRenderingContext2D, hole: HoleDef): void {
  const r = rng(hole.id * 7919 + 13);
  const items: { x: number; y: number; k: number; s: number }[] = [];
  for (let tries = 0; tries < 400 && items.length < 34; tries++) {
    const x = -10 + r() * 820;
    const y = -5 + r() * 510;
    const k = r();
    const s = k < 0.35 ? 11 + r() * 9 : k < 0.7 ? 5 + r() * 4 : 2;
    if (farFromCourse(hole, x, y, 14 + s) && items.every((o) => Math.hypot(o.x - x, o.y - y) > o.s + s + 4)) items.push({ x, y, k, s });
  }
  for (const it of items) {
    if (it.k < 0.35) bush(ctx, it.x, it.y, it.s);
    else if (it.k < 0.7) rock(ctx, it.x, it.y, it.s);
    else flower(ctx, it.x, it.y, r);
  }
}

function bush(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath(); ctx.ellipse(x + s * 0.3, y + s * 0.45, s * 1.05, s * 0.9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  const g = ctx.createRadialGradient(x - s * 0.35, y - s * 0.4, 1, x, y, s * 1.1);
  g.addColorStop(0, PAL.treeLight); g.addColorStop(1, PAL.tree);
  ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(8,40,18,0.7)'; ctx.stroke();
  ctx.fillStyle = 'rgba(190,240,170,0.25)';
  ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.35, s * 0.35, 0, Math.PI * 2); ctx.fill();
}

function rock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath(); ctx.ellipse(x + 2, y + s * 0.6, s * 1.1, s * 0.6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, 0.5, x, y, s * 1.1);
  g.addColorStop(0, '#c4cacf'); g.addColorStop(1, '#6c747b');
  ctx.beginPath(); ctx.ellipse(x, y, s * 1.1, s * 0.85, 0.4, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(25,30,34,0.7)'; ctx.stroke();
}

function flower(ctx: CanvasRenderingContext2D, x: number, y: number, r: () => number): void {
  const cols = ['#ffd84a', '#ff8fb8', '#ffffff', '#ffa24a'];
  ctx.fillStyle = cols[Math.floor(r() * cols.length)] as string;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#7a4a10';
  ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
}
