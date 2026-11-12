import type { Vec } from '../physics/types';
import { CONFIG } from '../config';
import { PAL } from './palette';
import { polyPath } from './paths';

type Polys = readonly (readonly Vec[])[];

/** Soft ambient occlusion where the turf meets a wall (clipped to the playable floor). */
export function drawWallAO(ctx: CanvasRenderingContext2D, polys: Polys): void {
  ctx.save();
  polyPath(ctx, polys);
  ctx.clip('evenodd');
  ctx.lineJoin = 'round';
  for (const [w, a] of [[34, 0.05], [26, 0.06], [19, 0.08], [13, 0.1]] as const) {
    polyPath(ctx, polys);
    ctx.lineWidth = w;
    ctx.strokeStyle = `rgba(0,25,10,${a})`;
    ctx.stroke();
  }
  ctx.restore();
}

/** Bevelled walls: cast shadow, dark edge, lit body, top highlight and a shaded lower lip. */
export function drawWalls(ctx: CanvasRenderingContext2D, polys: Polys, scale: number): void {
  const w = CONFIG.wall.half * 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 7 * scale;
  ctx.shadowOffsetX = 4 * scale;
  ctx.shadowOffsetY = 6 * scale;
  polyPath(ctx, polys);
  ctx.lineWidth = w + 2.4;
  ctx.strokeStyle = PAL.wallEdge;
  ctx.stroke();
  ctx.restore();
  polyPath(ctx, polys);
  ctx.lineWidth = w + 2.4;
  ctx.strokeStyle = PAL.wallEdge;
  ctx.stroke();
  polyPath(ctx, polys);
  ctx.lineWidth = w;
  ctx.strokeStyle = PAL.wallBody;
  ctx.stroke();
  ctx.save();
  ctx.translate(1.5, 1.7);
  polyPath(ctx, polys);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = PAL.wallDark;
  ctx.stroke();
  ctx.translate(-3.1, -3.4);
  polyPath(ctx, polys);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = PAL.wallLight;
  ctx.stroke();
  ctx.restore();
  // Rivet caps on every corner.
  for (const poly of polys) {
    for (const p of poly) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = PAL.wallDark;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x - 0.6, p.y - 0.7, 1, 0, Math.PI * 2);
      ctx.fillStyle = PAL.wallLight;
      ctx.fill();
    }
  }
}
