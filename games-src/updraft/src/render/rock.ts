// Rock walls and pillars: textured stone body, depth shading, inner rim light and a bright glowing edge,
// so the corridor boundary reads clearly against the dark cave.
import type { Obstacle, World } from '../world';
import { hexA } from './caveMath';
import { rockPattern } from './rockTexture';
import type { Palette, View } from './view';

const STEP = 8;
/** Inner glow bands + rim light along an already-traced edge path (clip must be active). */
function edgeLight(ctx: CanvasRenderingContext2D, edge: Path2D, p: Palette): void {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = p.rockHi;
  for (const [w, a] of [[34, 0.18], [18, 0.28], [8, 0.45]] as const) {
    ctx.globalAlpha = a;
    ctx.lineWidth = w;
    ctx.stroke(edge);
  }
  ctx.globalAlpha = 1;
}

function rim(ctx: CanvasRenderingContext2D, edge: Path2D, p: Palette, assist: boolean): void {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = p.glow;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = assist ? 12 : 9;
  ctx.stroke(edge);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.rim;
  ctx.lineWidth = assist ? 4 : 2.5;
  ctx.stroke(edge);
}

export function drawWalls(ctx: CanvasRenderingContext2D, v: View, p: Palette, world: World, camX: number, assist: boolean): void {
  world.ensure(camX + v.wv + 40);
  const pat = rockPattern(ctx, p, camX, v);
  for (const side of ['ceil', 'floor'] as const) {
    const at = side === 'ceil' ? (x: number) => world.ceilAt(x) : (x: number) => world.floorAt(x);
    const far = side === 'ceil' ? v.top - 20 : v.bottom + 20;
    const edge = new Path2D();
    const body = new Path2D();
    body.moveTo(-STEP, far);
    for (let sx = -STEP; sx <= v.wv + STEP; sx += STEP) {
      const y = at(sx + camX);
      body.lineTo(sx, y);
      if (sx === -STEP) edge.moveTo(sx, y);
      else edge.lineTo(sx, y);
    }
    body.lineTo(v.wv + STEP, far);
    body.closePath();
    ctx.fillStyle = pat ?? p.rock;
    ctx.fill(body);
    ctx.save();
    ctx.clip(body);
    edgeLight(ctx, edge, p);
    ctx.restore();
    rim(ctx, edge, p, assist);
  }
}

function hatch(ctx: CanvasRenderingContext2D, o: Obstacle, sx: number, p: Palette): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, o.y0, o.w, o.y1 - o.y0);
  ctx.clip();
  ctx.strokeStyle = p.rim;
  ctx.lineWidth = 2;
  for (let d = -o.y1; d < o.w + o.y1; d += 9) {
    ctx.beginPath();
    ctx.moveTo(sx + d, o.y1);
    ctx.lineTo(sx + d + (o.y1 - o.y0), o.y0);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawObstacles(ctx: CanvasRenderingContext2D, v: View, p: Palette, world: World, camX: number, assist: boolean): void {
  const pat = rockPattern(ctx, p, camX, v);
  for (const o of world.obstaclesIn(camX - 60, camX + v.wv + 60)) {
    const sx = o.x - camX;
    const shape = new Path2D();
    shape.roundRect(sx, o.y0, o.w, o.y1 - o.y0, o.top ? [0, 0, 12, 12] : [12, 12, 0, 0]);
    ctx.fillStyle = pat ?? p.rock;
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    const sh = ctx.createLinearGradient(sx, 0, sx + o.w, 0);
    sh.addColorStop(0, hexA(p.rockHi, 0.55));
    sh.addColorStop(0.45, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(2,8,16,0.5)');
    ctx.fillStyle = sh;
    ctx.fillRect(sx, o.y0, o.w, o.y1 - o.y0);
    const tip = o.top ? o.y1 : o.y0;
    const cap = ctx.createLinearGradient(0, tip, 0, tip + (o.top ? -26 : 26));
    cap.addColorStop(0, hexA(p.glow, 0.35));
    cap.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cap;
    ctx.fillRect(sx, Math.min(tip, tip + (o.top ? -26 : 26)), o.w, 26);
    ctx.restore();
    if (assist) hatch(ctx, o, sx, p);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = p.glow;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = assist ? 11 : 8;
    ctx.stroke(shape);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = p.rim;
    ctx.lineWidth = assist ? 4 : 2.5;
    ctx.stroke(shape);
  }
}
