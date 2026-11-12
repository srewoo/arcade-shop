// The bowling ball: marbled resin with swirls that roll, finger holes, rim light and gloss.
import { BALL_R } from './constants';
import { project, type Camera } from './project';
import { ground } from './renderPin';
import type { Ball } from './worldTypes';

type Ctx = CanvasRenderingContext2D;

const SWIRLS: readonly (readonly [number, string, number])[] = [
  [0.0, 'rgba(255,92,174,0.55)', 0.3],
  [2.1, 'rgba(120,230,255,0.4)', 0.22],
  [4.2, 'rgba(255,255,255,0.28)', 0.16],
];

function marble(ctx: Ctx, x: number, y: number, r: number, roll: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineCap = 'round';
  for (const [off, color, wid] of SWIRLS) {
    const ph = roll * 0.9 + off;
    const ry = Math.abs(Math.sin(ph)) * r * 0.95;
    ctx.strokeStyle = color;
    ctx.lineWidth = r * wid;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.02, Math.max(0.5, ry), 0, Math.sin(ph) > 0 ? 0.1 : Math.PI + 0.1, Math.sin(ph) > 0 ? Math.PI - 0.1 : Math.PI * 2 - 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

function holes(ctx: Ctx, cx: number, cy: number, r: number, roll: number): void {
  const spots: readonly (readonly [number, number])[] = [[0, 0.5], [0.45, 0.62], [-0.2, 0.7]];
  for (const [phase, rad] of spots) {
    const ang = roll + phase * 2.2 + 0.4;
    const depth = Math.cos(ang);
    if (depth <= 0.05) continue;
    const hx = cx + phase * r * 0.8;
    const hy = cy - Math.sin(ang) * r * rad * 1.2;
    ctx.fillStyle = '#05030f';
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.13 * depth, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(hx, hy + r * 0.05, r * 0.1 * depth, r * 0.05, 0, 0, Math.PI);
    ctx.fill();
  }
}

/** Draw the ball with rolling finger holes. */
export function drawBall(ctx: Ctx, cam: Camera, ball: Ball): void {
  ground(ctx, cam, ball.x, ball.y, BALL_R, 0.4);
  const c = project(cam, ball.x, ball.y, BALL_R);
  const r = BALL_R * c.s;
  const g = ctx.createRadialGradient(c.sx - r * 0.35, c.sy - r * 0.4, r * 0.1, c.sx, c.sy, r);
  g.addColorStop(0, '#a98cff');
  g.addColorStop(0.5, '#4128a8');
  g.addColorStop(1, '#120a3a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.sx, c.sy, r, 0, Math.PI * 2);
  ctx.fill();
  marble(ctx, c.sx, c.sy, r, ball.roll);
  holes(ctx, c.sx, c.sy, r, ball.roll);
  // Terminator shade, rim light, then specular.
  const sh = ctx.createRadialGradient(c.sx - r * 0.3, c.sy - r * 0.35, r * 0.45, c.sx, c.sy, r * 1.02);
  sh.addColorStop(0, 'rgba(10,4,40,0)');
  sh.addColorStop(0.75, 'rgba(10,4,40,0.15)');
  sh.addColorStop(1, 'rgba(10,4,40,0.6)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(c.sx, c.sy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,225,255,0.55)';
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.beginPath();
  ctx.arc(c.sx, c.sy, r * 0.96, 0.15 * Math.PI, 0.6 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(c.sx - r * 0.38, c.sy - r * 0.45, r * 0.2, r * 0.11, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(c.sx + r * 0.3, c.sy + r * 0.38, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
}
