// Procedural lane, walls and backdrop drawn with Canvas 2D in pseudo-perspective.
import { GUTTER_WIDTH, LANE_HALF, SIDE_WALL } from './constants';
import { project, type Camera } from './project';
import { drawPitAndBack } from './sceneBackdrop';
import { APPROACH, BACK_Y, WALL_H, poly, type Ctx } from './sceneGeo';
import { drawLaneSurface } from './sceneWood';

export { drawBackdrop } from './sceneBackdrop';

const TRIM = { '-1': '#ff5cae', '1': '#4dd8ff' } as const;

function wallPanel(ctx: Ctx, cam: Camera, side: number, top: number): void {
  const x = side * SIDE_WALL;
  const a = project(cam, x, top, 0);
  const b = project(cam, x, BACK_Y, 0);
  const g = ctx.createLinearGradient(a.sx, 0, b.sx, 0);
  g.addColorStop(0, '#332a6e');
  g.addColorStop(1, '#1a153f');
  poly(ctx, cam, [[x, top, 0], [x, BACK_Y, 0], [x, BACK_Y, WALL_H], [x, top, WALL_H]], g);
  // Kick plate band with a darker base, and vertical panel seams every metre.
  poly(ctx, cam, [[x, top, 0], [x, BACK_Y, 0], [x, BACK_Y, WALL_H * 0.28], [x, top, WALL_H * 0.28]], 'rgba(8,6,24,0.5)');
  ctx.strokeStyle = 'rgba(160,140,255,0.2)';
  for (let y = Math.ceil(Math.max(top, cam.y) / 100) * 100; y < BACK_Y; y += 100) {
    const p0 = project(cam, x, y, 0);
    const p1 = project(cam, x, y, WALL_H);
    ctx.lineWidth = Math.max(0.6, p0.s * 0.25);
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.lineTo(p1.sx, p1.sy);
    ctx.stroke();
    // lamp on each seam
    const lamp = project(cam, x, y + 50, WALL_H * 0.62);
    const lr = Math.max(2, lamp.s * 5);
    ctx.fillStyle = side < 0 ? 'rgba(255,110,190,0.8)' : 'rgba(110,225,255,0.8)';
    ctx.beginPath();
    ctx.arc(lamp.sx, lamp.sy, lr * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = side < 0 ? 'rgba(255,110,190,0.14)' : 'rgba(110,225,255,0.14)';
    ctx.beginPath();
    ctx.arc(lamp.sx, lamp.sy, lr * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWalls(ctx: Ctx, cam: Camera): void {
  const top = Math.max(-APPROACH, cam.y - 10);
  for (const side of [-1, 1] as const) {
    wallPanel(ctx, cam, side, top);
    const x = side * SIDE_WALL;
    const t0 = project(cam, x, top, WALL_H);
    const t1 = project(cam, x, BACK_Y, WALL_H);
    ctx.lineCap = 'round';
    ctx.strokeStyle = TRIM[String(side) as '-1' | '1'];
    // Glow: a wide translucent stroke under a crisp core (cheaper than shadowBlur on repaint).
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = Math.max(5, t0.s * 3.4);
    ctx.beginPath();
    ctx.moveTo(t0.sx, t0.sy);
    ctx.lineTo(t1.sx, t1.sy);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(1.8, t0.s * 1);
    ctx.beginPath();
    ctx.moveTo(t0.sx, t0.sy);
    ctx.lineTo(t1.sx, t1.sy);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
}

export function drawLane(ctx: Ctx, cam: Camera): void {
  drawPitAndBack(ctx, cam);
  drawLaneSurface(ctx, cam);
  drawWalls(ctx, cam);
}

/** Dark bar sweeping the deck after a ball. `y` is its world position. */
export function drawSweeper(ctx: Ctx, cam: Camera, y: number): void {
  const a = project(cam, -SIDE_WALL, y, 0);
  const b = project(cam, SIDE_WALL, y, 0);
  const t = project(cam, 0, y, 12);
  const g = ctx.createLinearGradient(0, t.sy, 0, a.sy);
  g.addColorStop(0, '#6a6390');
  g.addColorStop(0.25, '#3b3550');
  g.addColorStop(1, '#1d1930');
  ctx.fillStyle = g;
  ctx.fillRect(a.sx, t.sy, b.sx - a.sx, a.sy - t.sy);
  ctx.fillStyle = '#b6afd8';
  ctx.fillRect(a.sx, t.sy, b.sx - a.sx, Math.max(1, a.s * 1.5));
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(a.sx, a.sy, b.sx - a.sx, Math.max(2, a.s * 2));
}

export const GUTTER_CENTER = LANE_HALF + GUTTER_WIDTH / 2;
