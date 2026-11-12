// Live bay feedback: glowing highlight, hatch + tick (non-colour cues), progress bar and heading guide.
import { mixHex } from '../alignment';
import { corners } from '../geom';
import type { Box } from '../geom';
import type { Level } from '../levels/types';
import { PAL } from './palette';

function path(ctx: CanvasRenderingContext2D, b: Box, grow = 0): void {
  const c = corners(b, grow);
  ctx.beginPath();
  c.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

/** Bay highlight: amber -> green as the rig lines up; hatch + tick are the non-colour cues. */
export function drawBay(ctx: CanvasRenderingContext2D, level: Level, hold: number, inBay: boolean, pulse: number, assist: boolean, near = 0): void {
  const b = level.bay;
  const col = mixHex(PAL.bay, PAL.bayOk, inBay ? 1 : near);
  glow(ctx, b, col, 0.14 + 0.1 * pulse + 0.25 * near + 0.3 * hold);
  ctx.save();
  path(ctx, b);
  ctx.globalAlpha = 0.18 + 0.1 * pulse + 0.18 * near + 0.3 * hold;
  ctx.fillStyle = col;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.clip();
  if (assist || inBay) hatch(ctx, b, col, inBay ? 0.7 : 0.45);
  ctx.restore();
  ctx.strokeStyle = col;
  ctx.lineWidth = assist ? 0.22 : 0.16;
  ctx.setLineDash(inBay ? [] : [0.7, 0.45]);
  path(ctx, b);
  ctx.stroke();
  ctx.setLineDash([]);
  brackets(ctx, b, col, assist ? 0.34 : 0.26);
  if (inBay) tick(ctx, b);
  if (hold > 0) progressBar(ctx, b, hold);
}

/** Bay axis and the car's heading line: they merge as the angle closes. Colour + dash style carry the meaning. */
export function drawHeading(ctx: CanvasRenderingContext2D, level: Level, car: { x: number; y: number; a: number; phi: number }, angleOk: boolean): void {
  const b = level.bay;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.strokeStyle = PAL.line;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.07;
  ctx.setLineDash([0.3, 0.3]);
  ctx.beginPath();
  ctx.moveTo(-b.hw, 0);
  ctx.lineTo(b.hw, 0);
  ctx.stroke();
  ctx.restore();
  const heading = level.goal === 'trailer' ? car.phi : car.a;
  const len = 1.6;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(heading);
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = angleOk ? PAL.bayOk : PAL.warnLine;
  ctx.lineWidth = 0.12;
  ctx.setLineDash(angleOk ? [] : [0.25, 0.2]);
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

function tick(ctx: CanvasRenderingContext2D, b: Box): void {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.strokeStyle = '#0d2a18';
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 0.28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.5, 0.05);
  ctx.lineTo(-0.12, 0.45);
  ctx.lineTo(0.6, -0.4);
  ctx.stroke();
  ctx.restore();
}

function hatch(ctx: CanvasRenderingContext2D, b: Box, col: string, gap: number): void {
  ctx.strokeStyle = col;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 0.08;
  const reach = b.hw + b.hh;
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  for (let d = -reach; d < reach; d += gap) {
    ctx.beginPath();
    ctx.moveTo(d - b.hh, -b.hh);
    ctx.lineTo(d + b.hh, b.hh);
    ctx.stroke();
  }
}

function progressBar(ctx: CanvasRenderingContext2D, b: Box, hold: number): void {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(-b.hw, -0.18, b.hw * 2, 0.36);
  ctx.fillStyle = PAL.bayOk;
  ctx.fillRect(-b.hw, -0.18, b.hw * 2 * hold, 0.36);
  ctx.restore();
}

/** Soft light spilling out of the bay. */
function glow(ctx: CanvasRenderingContext2D, b: Box, col: string, alpha: number): void {
  const r = Math.max(b.hw, b.hh) + 1.4;
  const g = ctx.createRadialGradient(b.x, b.y, Math.min(b.hw, b.hh) * 0.6, b.x, b.y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(b.x - r, b.y - r, r * 2, r * 2);
  ctx.restore();
}

/** Solid corner brackets over the dashed outline. */
function brackets(ctx: CanvasRenderingContext2D, b: Box, col: string, len: number): void {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.a);
  ctx.strokeStyle = col;
  ctx.lineWidth = 0.24;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const l = Math.min(len * 4, b.hh, b.hw);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * b.hw, sy * (b.hh - l));
      ctx.lineTo(sx * b.hw, sy * b.hh);
      ctx.lineTo(sx * (b.hw - l), sy * b.hh);
      ctx.stroke();
    }
  }
  ctx.restore();
}
