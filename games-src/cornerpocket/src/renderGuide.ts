// Aim guide, cue stick, legal-target rings, cancel ring: drawn in table coordinates.
import type { AimGuide } from './aim';
import { LAYOUT } from './config/layout';
import { BALL_R, TABLE_H, TABLE_W } from './constants';
import type { Level } from './cpu';
import { type Rect, rayExit, stickLength } from './geom';
import type { Ball } from './physics';

const TABLE: Rect = { x0: 0, y0: 0, x1: TABLE_W, y1: TABLE_H };

function ray(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, len: number): { x: number; y: number } {
  const l = Math.min(len, rayExit(x, y, dx, dy, TABLE)); // rays stop at the cushions
  const ex = x + dx * l; const ey = y + dy * l;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  return { x: ex, y: ey };
}

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'diamond' | 'circle'): void {
  ctx.setLineDash([]);
  ctx.beginPath();
  if (kind === 'diamond') { ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.closePath(); }
  else ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.stroke();
}

/** Object line: solid yellow. Cue deflection: dashed cyan. Shape, not just hue, tells them apart. */
export function drawGuide(ctx: CanvasRenderingContext2D, g: AimGuide, level: Level, assist: boolean): void {
  const easy = level === 'easy';
  ctx.save();
  ctx.lineCap = 'round'; ctx.setLineDash([6, 7]); ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.moveTo(g.from.x, g.from.y); ctx.lineTo(g.end.x, g.end.y); ctx.stroke();
  ctx.setLineDash([]);
  if (g.hitId !== null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(g.end.x, g.end.y, BALL_R, 0, Math.PI * 2); ctx.stroke();
    if (g.objectDir) {
      ctx.strokeStyle = 'rgba(255,214,102,0.95)'; ctx.lineWidth = 2.5;
      const e = ray(ctx, g.end.x + g.objectDir.x * BALL_R * 2, g.end.y + g.objectDir.y * BALL_R * 2, g.objectDir.x, g.objectDir.y, easy ? 220 : 60);
      if (assist) marker(ctx, e.x, e.y, 'diamond');
    }
    if (g.cueDir) {
      ctx.strokeStyle = 'rgba(160,230,255,0.95)'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
      const e = ray(ctx, g.end.x, g.end.y, g.cueDir.x, g.cueDir.y, easy ? 120 : 40);
      if (assist) marker(ctx, e.x, e.y, 'circle');
    }
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(g.end.x, g.end.y, 4, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

/** Cue stick behind the cue ball: pulled back with power, clipped to the canvas and faded at the tip. */
export function drawStick(ctx: CanvasRenderingContext2D, cue: Ball, angle: number, power: number, bounds: Rect): void {
  const gap = BALL_R + 5 + power * 70;
  const ux = Math.cos(angle); const uy = Math.sin(angle);
  const len = stickLength(cue.x - ux * gap, cue.y - uy * gap, -ux, -uy, bounds);
  if (len < 8) return;
  const x0 = cue.x - ux * gap; const y0 = cue.y - uy * gap;
  const x1 = x0 - ux * len; const y1 = y0 - uy * len;
  const fade = Math.max(0, 1 - LAYOUT.stickFade / len);
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, 'rgba(232,201,138,1)');
  grad.addColorStop(Math.min(0.6, fade), 'rgba(168,113,58,1)');
  grad.addColorStop(fade, 'rgba(58,35,18,1)');
  grad.addColorStop(1, 'rgba(58,35,18,0)');
  const nx = -uy; const ny = ux; // unit normal
  const w0 = 1.7; const w1 = 3.4;
  ctx.save();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0, y0 + ny * w0); ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1); ctx.lineTo(x0 - nx * w0, y0 - ny * w0); ctx.closePath(); ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,240,210,0.45)'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(x0 - ux * 8 + nx * 0.6, y0 - uy * 8 + ny * 0.6); ctx.lineTo(x0 - ux * len * 0.75 + nx * 1.2, y0 - uy * len * 0.75 + ny * 1.2); ctx.stroke();
  ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = w0 * 2 + 0.4; // ferrule
  ctx.beginPath(); ctx.moveTo(x0 - ux * 1, y0 - uy * 1); ctx.lineTo(x0 - ux * 7, y0 - uy * 7); ctx.stroke();
  ctx.strokeStyle = '#6fb7e6'; ctx.lineWidth = w0 * 2 + 0.4; // chalked tip
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - ux * 2.2, y0 - uy * 2.2); ctx.stroke();
  ctx.restore();
}

/** Dashed rings under the balls the human may legally hit (8-ball, after groups are assigned). */
export function drawHighlights(ctx: CanvasRenderingContext2D, balls: readonly Ball[], ids: readonly number[]): void {
  if (ids.length === 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
  for (const b of balls) {
    if (b.pocketed || !ids.includes(b.id)) continue;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R + 4, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

export function drawPlaceHint(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, BALL_R + 7, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/** Ring showing the pull-cancel zone while dragging, or the grab area after a tap that missed it. */
export function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, dash: boolean): void {
  ctx.save();
  ctx.globalAlpha = alpha; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  ctx.setLineDash(dash ? [5, 5] : []);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

/** Onboarding ghost: a fingertip circle pulling back from the cue ball, along the aim line. */
export function drawGhostPull(ctx: CanvasRenderingContext2D, cue: Ball, angle: number, k: number): void {
  const d = BALL_R + 14 + k * 70;
  const gx = cue.x - Math.cos(angle) * d; const gy = cue.y - Math.sin(angle) * d;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(gx, gy, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cue.x, cue.y); ctx.lineTo(gx, gy); ctx.stroke();
  ctx.restore();
}
