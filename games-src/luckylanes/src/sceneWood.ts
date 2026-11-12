// The playing surface: maple boards with grain, lacquer sheen, gutters, arrows, dots and the foul line.
import { GUTTER_WIDTH, HEAD_Y, LANE_HALF, PIT_Y, SIDE_WALL } from './constants';
import { memoGradient } from './gradients';
import { BREAK_Y, project, type Camera } from './project';
import { APPROACH, DECK_END, DECK_Y, floorStrip, hash01, tracePoly, type Ctx } from './sceneGeo';

const BOARDS = 21;
const BOARD_W = (LANE_HALF * 2) / BOARDS;
const APPROACH_BOARDS = 28;
const APPROACH_W = (SIDE_WALL * 2) / APPROACH_BOARDS;
/** The long edges of a strip are exact lines up to this y; past it the camera opens up. */
const SPLITS = [-APPROACH, BREAK_Y, PIT_Y] as const;

function wood(h: number, s: number, l: number, n: number, spread: number): string {
  const j = (hash01(n) - 0.5) * spread;
  return `hsl(${h + j * 0.35} ${s}% ${l + j}%)`;
}

function boardStrips(ctx: Ctx, cam: Camera, x0: number, w: number, count: number, ya: number, yb: number, base: readonly [number, number, number], seed: number): void {
  for (let i = 0; i < count; i++) {
    const n = seed + i;
    floorStrip(ctx, cam, x0 + i * w, x0 + (i + 1) * w + 0.15, ya, yb, wood(base[0], base[1], base[2], n, 6));
  }
}

function approachArea(ctx: Ctx, cam: Camera): void {
  boardStrips(ctx, cam, -SIDE_WALL, APPROACH_W, APPROACH_BOARDS, -APPROACH, 0, [31, 62, 56], 40);
  // Darker approach fade towards the player and a soft pool of light on the slide zone.
  const g = ctx.createLinearGradient(0, project(cam, 0, -APPROACH, 0).sy, 0, project(cam, 0, 0, 0).sy);
  g.addColorStop(0, 'rgba(40,18,0,0.05)');
  g.addColorStop(1, 'rgba(255,214,150,0.16)');
  floorStrip(ctx, cam, -SIDE_WALL, SIDE_WALL, -APPROACH, 0, g);
  ctx.strokeStyle = 'rgba(80,38,8,0.22)';
  for (let k = 0; k <= APPROACH_BOARDS; k++) {
    const x = -SIDE_WALL + k * APPROACH_W;
    const a = project(cam, x, Math.max(-APPROACH, cam.y), 0);
    const b = project(cam, x, 0, 0);
    ctx.lineWidth = Math.max(0.5, a.s * 0.09);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(60,28,6,0.3)';
  ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    const y = -k * 160;
    if (y < cam.y) continue;
    const a = project(cam, -SIDE_WALL, y, 0);
    const b = project(cam, SIDE_WALL, y, 0);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
}

function maple(ctx: Ctx, cam: Camera): void {
  for (let s = 0; s < SPLITS.length - 1; s++) {
    const ya = Math.max(0, SPLITS[s] as number) - (s > 0 ? 1.5 : 0);
    const yb = SPLITS[s + 1] as number;
    if (yb <= 0) continue;
    boardStrips(ctx, cam, -LANE_HALF, BOARD_W, BOARDS, ya, yb, [35, 78, 68], 0);
  }
  // Lacquer: staggered plank seams, then a warm darkening towards the pins.
  ctx.strokeStyle = 'rgba(120,70,20,0.16)';
  for (let i = 0; i < BOARDS; i++) {
    const x = -LANE_HALF + i * BOARD_W + BOARD_W / 2;
    for (let y = 120 + hash01(i * 3.1) * 240; y < PIT_Y; y += 330) {
      if (y < Math.max(0, cam.y)) continue;
      const a = project(cam, x - BOARD_W / 2, y, 0);
      const b = project(cam, x + BOARD_W / 2, y, 0);
      ctx.lineWidth = Math.max(0.5, a.s * 0.12);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }
}

function boardLines(ctx: Ctx, cam: Camera): void {
  const y0 = Math.max(0, cam.y);
  ctx.strokeStyle = 'rgba(110,60,14,0.26)';
  for (let k = 0; k <= BOARDS; k++) {
    const x = -LANE_HALF + k * BOARD_W;
    const a = project(cam, x, y0, 0);
    const b = project(cam, x, PIT_Y, 0);
    ctx.lineWidth = Math.max(0.5, a.s * 0.09);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
}

/** Overhead light pools reflected in the lacquer, clipped to the boards. */
function sheen(ctx: Ctx, cam: Camera): void {
  ctx.save();
  tracePoly(ctx, cam, [[-LANE_HALF, Math.max(0, cam.y), 0], [LANE_HALF, Math.max(0, cam.y), 0], [LANE_HALF, PIT_Y, 0], [-LANE_HALF, PIT_Y, 0]]);
  ctx.clip();
  for (let y = 60; y < HEAD_Y + 200; y += 360) {
    if (y < cam.y - 100) continue;
    const c = project(cam, 0, y, 0);
    const rx = LANE_HALF * c.s * 1.5;
    const ry = Math.max(8, 150 * c.s * 0.5);
    const key = `sheen|${Math.round(rx)}|${Math.round(ry)}`;
    ctx.save();
    ctx.translate(c.sx, c.sy);
    ctx.scale(rx, ry);
    ctx.fillStyle = memoGradient(key, () => {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(255,250,235,0.42)');
      g.addColorStop(0.55, 'rgba(255,240,210,0.14)');
      g.addColorStop(1, 'rgba(255,240,210,0)');
      return g;
    });
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function gutters(ctx: Ctx, cam: Camera): void {
  for (const side of [-1, 1]) {
    const xi = side * LANE_HALF;
    const xo = side * SIDE_WALL;
    for (let s = 0; s < SPLITS.length - 1; s++) {
      const ya = Math.max(0, SPLITS[s] as number) - (s > 0 ? 1.5 : 0);
      const yb = SPLITS[s + 1] as number;
      if (yb <= 0) continue;
      const a = Math.max(ya, cam.y - 10);
      if (a >= yb) continue;
      const p0 = project(cam, xi, a, 0);
      const p1 = project(cam, xo, a, 0);
      const g = ctx.createLinearGradient(p0.sx, 0, p1.sx, 0);
      g.addColorStop(0, '#1b1c28');
      g.addColorStop(0.45, '#393c52');
      g.addColorStop(1, '#202233');
      floorStrip(ctx, cam, Math.min(xi, xo), Math.max(xi, xo), a, yb, g);
    }
    // Groove lip: a bright rim where the lane meets the channel and a shadow under it.
    const lipA = project(cam, xi, Math.max(0, cam.y), 0);
    const lipB = project(cam, xi, PIT_Y, 0);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(1.2, lipA.s * 1.4);
    ctx.beginPath();
    ctx.moveTo(lipA.sx + side * lipA.s * 0.9, lipA.sy);
    ctx.lineTo(lipB.sx + side * lipB.s * 0.9, lipB.sy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,236,200,0.8)';
    ctx.lineWidth = Math.max(0.8, lipA.s * 0.5);
    ctx.beginPath();
    ctx.moveTo(lipA.sx, lipA.sy);
    ctx.lineTo(lipB.sx, lipB.sy);
    ctx.stroke();
  }
}

function inlay(ctx: Ctx, cam: Camera): void {
  for (let k = -3; k <= 3; k++) {
    const x = k * 13.6;
    const y = 430 + (3 - Math.abs(k)) * 45;
    if (y >= cam.y) {
      const p = project(cam, x, y, 0);
      const q = project(cam, x, y + 60, 0);
      const wing = 2.8 * p.s;
      ctx.beginPath();
      ctx.moveTo(p.sx - wing, p.sy);
      ctx.lineTo(p.sx + wing, p.sy);
      ctx.lineTo(q.sx, q.sy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(78,38,10,0.82)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,170,0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    if (k % 2 === 0 && 230 > cam.y) {
      const d = project(cam, x, 230, 0);
      ctx.fillStyle = 'rgba(78,38,10,0.85)';
      ctx.beginPath();
      ctx.arc(d.sx, d.sy, Math.max(1, 1.5 * d.s), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,180,0.35)';
      ctx.beginPath();
      ctx.arc(d.sx - d.s * 0.4, d.sy - d.s * 0.4, Math.max(0.6, 0.5 * d.s), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const f0 = project(cam, 0, -2, 0);
  ctx.save();
  ctx.shadowColor = 'rgba(255,60,60,0.8)';
  ctx.shadowBlur = Math.max(4, f0.s * 5);
  floorStrip(ctx, cam, -LANE_HALF, LANE_HALF, -2, 2, '#d9332f');
  ctx.restore();
  // Pin deck spot marks and a pool of light over the rack.
  floorStrip(ctx, cam, -LANE_HALF, LANE_HALF, DECK_Y, DECK_END, 'rgba(255,245,215,0.2)');
}

export function drawLaneSurface(ctx: Ctx, cam: Camera): void {
  approachArea(ctx, cam);
  maple(ctx, cam);
  boardLines(ctx, cam);
  sheen(ctx, cam);
  gutters(ctx, cam);
  inlay(ctx, cam);
}

export const GUTTER_EDGE = LANE_HALF + GUTTER_WIDTH;
