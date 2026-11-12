// Moving things: paddle, balls, power-up capsules and laser bolts.
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import type { World } from '../sim/world';
import { S } from '../strings';
import { roundRect } from './drawBricks';
import type { Fx } from './fx';

export interface ActorOpts { assist: boolean; reduced: boolean }
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
let haloSprite: HTMLCanvasElement | null = null;

function halo(): HTMLCanvasElement {
  if (haloSprite) return haloSprite;
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  rg.addColorStop(0, 'rgba(200,215,255,0.75)');
  rg.addColorStop(0.35, 'rgba(150,170,255,0.3)');
  rg.addColorStop(1, 'rgba(150,170,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 96, 96);
  haloSprite = c;
  return c;
}

export function drawPaddle(ctx: CanvasRenderingContext2D, w: World, alpha: number, fx: Fx): void {
  const x = lerp(w.paddle.px, w.paddle.x, alpha);
  const sq = fx.squash > 0 ? fx.squash / CONFIG.fx.squashSec : 0;
  const pw = w.paddle.w * (1 + 0.1 * sq);
  const { h } = CONFIG.paddle;
  const ph = h * (1 - 0.35 * sq);
  const y = w.paddleY + (h - ph);
  const laser = w.effects.laser > 0;
  const accent = laser ? PALETTE.paddleLaser : '#8a9cff';
  // Under-glow on the lane.
  const glow = ctx.createRadialGradient(x, y + ph, 0, x, y + ph, pw * 0.75);
  glow.addColorStop(0, laser ? 'rgba(255,154,85,0.5)' : 'rgba(138,108,240,0.5)');
  glow.addColorStop(1, 'rgba(138,108,240,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - pw, y - 6, pw * 2, ph + 40);
  // Body: brushed metal capsule with a glowing core strip.
  const body = ctx.createLinearGradient(0, y, 0, y + ph);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.35, '#dfe5ff');
  body.addColorStop(0.7, '#9aa8ee');
  body.addColorStop(1, '#5a68b4');
  roundRect(ctx, x - pw / 2, y, pw, ph, ph / 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const core = ctx.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0);
  core.addColorStop(0, 'rgba(255,255,255,0)');
  core.addColorStop(0.5, laser ? 'rgba(255,154,85,0.95)' : 'rgba(110,130,255,0.9)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(x - pw / 2, y + ph * 0.55, pw, ph * 0.22);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(x - pw / 2 + ph / 2, y + 1, pw - ph, 1.5);
  ctx.restore();
  // End caps.
  ctx.fillStyle = accent;
  for (const ex of [x - pw / 2 + ph * 0.5, x + pw / 2 - ph * 0.5]) {
    ctx.beginPath();
    ctx.arc(ex, y + ph / 2, ph * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(20,28,80,0.75)';
  ctx.lineWidth = 1.2;
  roundRect(ctx, x - pw / 2, y, pw, ph, ph / 2);
  ctx.stroke();
  if (laser) {
    for (const cx of [x - pw / 2 + 8, x + pw / 2 - 8]) {
      const cg = ctx.createLinearGradient(0, y - 10, 0, y);
      cg.addColorStop(0, '#fff3e0');
      cg.addColorStop(1, PALETTE.paddleLaser);
      ctx.fillStyle = cg;
      roundRect(ctx, cx - 3.5, y - 10, 7, 12, 2.5);
      ctx.fill();
    }
  }
}

export function drawBalls(ctx: CanvasRenderingContext2D, w: World, alpha: number, o: ActorOpts): void {
  const r = CONFIG.ball.r;
  const hs = halo();
  for (const b of w.balls) {
    const x = lerp(b.px, b.x, alpha);
    const y = lerp(b.py, b.y, alpha);
    ctx.drawImage(hs, x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
    if (!o.reduced && !b.stuck) {
      // Comet tail: tapering, cooling to blue.
      for (let i = CONFIG.ball.trail; i >= 1; i--) {
        const k = 1 - i / (CONFIG.ball.trail + 1);
        ctx.globalAlpha = 0.38 * k;
        ctx.beginPath();
        ctx.arc(x - b.vx * 0.007 * i, y - b.vy * 0.007 * i, r * (1 - i * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = i > 3 ? '#7d90ff' : '#c9d4ff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const sph = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    sph.addColorStop(0, '#ffffff');
    sph.addColorStop(0.55, '#e4eaff');
    sph.addColorStop(1, '#8c9cf0');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = sph;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PALETTE.edge;
    ctx.stroke();
  }
}

export function drawCapsules(ctx: CanvasRenderingContext2D, w: World, alpha: number): void {
  const { capsuleW: cw, capsuleH: ch } = CONFIG.power;
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of w.capsules) {
    const x = lerp(c.px, c.x, alpha);
    const y = lerp(c.py, c.y, alpha);
    const col = PALETTE.power[c.kind];
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    roundRect(ctx, x - cw / 2, y - ch / 2, cw, ch, ch / 2);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, y - ch / 2, 0, y + ch / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,30,0.3)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(S.powerLetter[c.kind], x, y + 1);
  }
}

export function drawBolts(ctx: CanvasRenderingContext2D, w: World): void {
  for (const b of w.bolts) {
    const g = ctx.createLinearGradient(0, b.y - 18, 0, b.y + 2);
    g.addColorStop(0, 'rgba(255,154,85,0)');
    g.addColorStop(0.6, PALETTE.paddleLaser);
    g.addColorStop(1, '#fff6e8');
    ctx.fillStyle = g;
    ctx.shadowColor = PALETTE.paddleLaser;
    ctx.shadowBlur = 8;
    ctx.fillRect(b.x - 2, b.y - 18, 4, 20);
  }
  ctx.shadowBlur = 0;
}
