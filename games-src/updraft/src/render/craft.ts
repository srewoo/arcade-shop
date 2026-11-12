// The player's craft: faceted arrowhead hull with a glass canopy, glowing engine ring, blinking
// wingtip lights and a teardrop thruster flame. Collision radius is unchanged (art is larger).
import { CONFIG } from '../config';
import type { Palette } from './view';

type Ctx = CanvasRenderingContext2D;

/** Visual scale of the craft relative to its collision radius (art only; the sim is unchanged). */
export const CRAFT_ART = 1.35;

export function wingPath(ctx: Ctx, r: number): void {
  ctx.beginPath();
  ctx.moveTo(r * 1.35, 0);
  ctx.lineTo(-r, -r * 1.0);
  ctx.lineTo(-r * 0.4, 0);
  ctx.lineTo(-r, r * 1.0);
  ctx.closePath();
}

function halo(ctx: Ctx, r: number, pal: Palette): void {
  const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 3.4);
  g.addColorStop(0, pal.flame);
  g.addColorStop(1, 'rgba(255, 138, 61, 0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Teardrop flame: outer orange, hot yellow core, white-hot tip. */
function flameTail(ctx: Ctx, r: number, pal: Palette, flicker: number, power: number): void {
  const len = r * (1.8 + flicker * 0.9) * power;
  const w = r * 0.42 * power;
  const layers = [[1, pal.flame, 'rgba(255,138,61,0)'], [0.62, '#ffd36a', 'rgba(255,211,106,0)'], [0.3, '#fff9dc', 'rgba(255,249,220,0)']] as const;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [k, c0, c1] of layers) {
    const g = ctx.createLinearGradient(-r * 0.7, 0, -r * 0.7 - len * k, 0);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -w * k);
    ctx.bezierCurveTo(-r * 0.7 - len * 0.35 * k, -w * k * 1.3, -r * 0.7 - len * 0.8 * k, -w * k * 0.4, -r * 0.7 - len * k, 0);
    ctx.bezierCurveTo(-r * 0.7 - len * 0.8 * k, w * k * 0.4, -r * 0.7 - len * 0.35 * k, w * k * 1.3, -r * 0.6, w * k);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function hull(ctx: Ctx, r: number, pal: Palette): void {
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, pal.flame);
  g.addColorStop(0.55, pal.craft);
  g.addColorStop(1, pal.craftInk);
  wingPath(ctx, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  wingPath(ctx, r);
  ctx.clip();
  ctx.fillStyle = 'rgba(70,20,0,0.32)';
  ctx.beginPath();
  ctx.moveTo(r * 1.35, 0);
  ctx.lineTo(-r * 0.4, 0);
  ctx.lineTo(-r, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.beginPath();
  ctx.moveTo(r * 1.35, 0);
  ctx.lineTo(-r, -r);
  ctx.lineTo(-r * 0.7, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pal.craftInk;
  ctx.lineWidth = 2;
  wingPath(ctx, r);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,12,0,0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(r * 1.35, 0);
  ctx.lineTo(-r * 0.4, 0);
  ctx.stroke();
}

function canopy(ctx: Ctx, r: number): void {
  const g = ctx.createLinearGradient(0, -r * 0.4, 0, r * 0.1);
  g.addColorStop(0, '#e9fbff');
  g.addColorStop(1, '#2b79a8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(r * 0.35, -r * 0.14, r * 0.5, r * 0.24, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,50,80,0.7)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(r * 0.28, -r * 0.24, r * 0.2, r * 0.07, -0.1, 0, Math.PI * 2);
  ctx.fill();
}

function lights(ctx: Ctx, r: number, time: number): void {
  const on = Math.floor(time * 2.4) % 2 === 0;
  for (const [y, col] of [[-r * 0.98, '#ff5b6e'], [r * 0.98, '#7dffb2']] as const) {
    ctx.fillStyle = on ? col : 'rgba(30,30,40,0.7)';
    ctx.beginPath();
    ctx.arc(-r * 0.95, y * 0.98, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCraft(
  ctx: Ctx, sx: number, y: number, vy: number, pal: Palette,
  opts: { ghost?: boolean; thrusting?: boolean; dead?: boolean; time?: number; glow?: boolean },
): void {
  const r = CONFIG.craft.radius * CRAFT_ART;
  ctx.save();
  ctx.translate(sx, y);
  ctx.rotate(Math.atan2(vy, 260) * 0.9);
  if (opts.ghost) {
    ctx.globalAlpha = 0.75;
    wingPath(ctx, r);
    ctx.strokeStyle = pal.ghost;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const time = opts.time ?? 0;
  if (opts.glow !== false) halo(ctx, r, pal);
  const flicker = 0.5 + 0.5 * Math.sin(time * 55);
  if (opts.thrusting) flameTail(ctx, r, pal, flicker, 1);
  else if (opts.glow !== false) flameTail(ctx, r, pal, flicker * 0.4, 0.45);
  hull(ctx, r, pal);
  canopy(ctx, r);
  lights(ctx, r, time);
  ctx.restore();
}
