// Static street furniture: kerb slabs, walls, pillars and cones, with lit tops and cast shadows.
import type { Obstacle } from '../levels/types';
import { PAL } from './palette';

type G = CanvasRenderingContext2D;

function slab(ctx: G, o: Obstacle, fill: string, edge: string, joints: boolean): void {
  const b = o.box;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-b.hw + 0.14, -b.hh + 0.18, b.hw * 2, b.hh * 2);
  ctx.fillStyle = edge;
  ctx.fillRect(-b.hw, -b.hh, b.hw * 2, b.hh * 2);
  const top = ctx.createLinearGradient(0, -b.hh, 0, b.hh);
  top.addColorStop(0, fill);
  top.addColorStop(1, edge);
  ctx.fillStyle = top;
  ctx.fillRect(-b.hw, -b.hh, b.hw * 2, b.hh * 1.25);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-b.hw, -b.hh, b.hw * 2, Math.min(0.08, b.hh * 0.3));
  if (joints) {
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 0.04;
    const long = b.hw > b.hh;
    const len = long ? b.hw * 2 : b.hh * 2;
    for (let d = 1.2; d < len; d += 1.2) {
      ctx.beginPath();
      if (long) { ctx.moveTo(-b.hw + d, -b.hh); ctx.lineTo(-b.hw + d, b.hh); }
      else { ctx.moveTo(-b.hw, -b.hh + d); ctx.lineTo(b.hw, -b.hh + d); }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function pillar(ctx: G, o: Obstacle): void {
  slab(ctx, o, PAL.pillar, '#6b7380', false);
  const b = o.box;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.beginPath();
  ctx.rect(-b.hw, -b.hh, b.hw * 2, b.hh * 2);
  ctx.clip();
  ctx.fillStyle = PAL.bay;
  const step = 0.3;
  for (let d = -b.hw - b.hh * 2; d < b.hw + b.hh * 2; d += step * 2) {
    ctx.beginPath();
    ctx.moveTo(d, -b.hh);
    ctx.lineTo(d + step, -b.hh);
    ctx.lineTo(d + step + b.hh * 2, b.hh);
    ctx.lineTo(d + b.hh * 2, b.hh);
    ctx.fill();
  }
  ctx.fillStyle = PAL.pillar;
  ctx.fillRect(-b.hw + 0.1, -b.hh + 0.1, b.hw * 2 - 0.2, b.hh * 2 - 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(-b.hw + 0.1, -b.hh + 0.1, b.hw * 2 - 0.2, 0.06);
  ctx.restore();
}

function cone(ctx: G, o: Obstacle): void {
  const b = o.box;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(b.x + 0.1, b.y + 0.12, 0.3, 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d96c0e';
  ctx.fillRect(b.x - 0.27, b.y - 0.27, 0.54, 0.54);
  const g = ctx.createRadialGradient(b.x - 0.07, b.y - 0.08, 0.02, b.x, b.y, 0.24);
  g.addColorStop(0, '#ffb35a');
  g.addColorStop(1, PAL.cone);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(b.x, b.y, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.cone;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFurniture(ctx: G, o: Obstacle): void {
  if (o.kind === 'kerb') slab(ctx, o, PAL.kerb, PAL.kerbEdge, true);
  else if (o.kind === 'wall') slab(ctx, o, PAL.wall, '#5a626e', true);
  else if (o.kind === 'pillar') pillar(ctx, o);
  else if (o.kind === 'cone') cone(ctx, o);
}
