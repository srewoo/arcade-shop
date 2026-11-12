// Static far layer: sky, sun, hills, floodlights and the grandstand structure.
import { PAL } from './palette';
import { BANDS } from './layout';
import { mulberry32 } from '../rng';

type Ctx = CanvasRenderingContext2D;
interface Box { x0: number; x1: number; top: number; bottom: number }

function sky(ctx: Ctx, b: Box): void {
  const g = ctx.createLinearGradient(0, b.top, 0, BANDS.stands.bottom);
  g.addColorStop(0, PAL.skyTop); g.addColorStop(0.55, PAL.skyMid); g.addColorStop(1, PAL.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(b.x0, b.top, b.x1 - b.x0, BANDS.stands.bottom - b.top);
  const sx = b.x0 + (b.x1 - b.x0) * 0.78;
  const glow = ctx.createRadialGradient(sx, 96, 4, sx, 96, 280);
  glow.addColorStop(0, 'rgba(255,248,200,0.95)'); glow.addColorStop(0.18, 'rgba(255,240,170,0.55)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(b.x0, b.top, b.x1 - b.x0, 520);
  ctx.fillStyle = PAL.sunCore;
  ctx.beginPath(); ctx.arc(sx, 96, 26, 0, Math.PI * 2); ctx.fill();
}

function hills(ctx: Ctx, b: Box): void {
  const w = b.x1 - b.x0;
  const layer = (base: number, amp: number, freq: number, phase: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(b.x0, BANDS.stands.bottom);
    for (let x = 0; x <= w; x += 12) ctx.lineTo(b.x0 + x, base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase) * amp * 0.4);
    ctx.lineTo(b.x1, BANDS.stands.bottom); ctx.closePath(); ctx.fill();
  };
  layer(300, 20, 0.006, 1, PAL.hillFar);
  layer(322, 14, 0.011, 4, PAL.hillNear);
  const rnd = mulberry32(77);
  ctx.fillStyle = PAL.trees;
  for (let x = b.x0; x < b.x1; x += 16 + rnd() * 18) {
    const h = 20 + rnd() * 22;
    ctx.beginPath(); ctx.ellipse(x, 336 - h * 0.3, 11 + rnd() * 6, h, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function floodlight(ctx: Ctx, x: number): void {
  ctx.fillStyle = '#6b7b92'; ctx.fillRect(x - 3, 130, 6, 270);
  ctx.fillStyle = '#4b5a70'; ctx.fillRect(x - 24, 108, 48, 26);
  ctx.fillStyle = '#fffbe0';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x - 14 + i * 14, 115 + j * 12, 4.4, 0, Math.PI * 2); ctx.fill(); }
  const g = ctx.createRadialGradient(x, 120, 2, x, 120, 70);
  g.addColorStop(0, 'rgba(255,252,220,0.5)'); g.addColorStop(1, 'rgba(255,252,220,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 70, 50, 140, 140);
}

function stands(ctx: Ctx, b: Box): void {
  const { top, bottom } = BANDS.stands;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#2c3850'); g.addColorStop(1, PAL.standBack);
  ctx.fillStyle = g; ctx.fillRect(b.x0, top, b.x1 - b.x0, bottom - top);
  BANDS.rows.forEach((y, i) => {
    ctx.fillStyle = PAL.standRow[i] ?? PAL.standBack;
    ctx.fillRect(b.x0, y + 10, b.x1 - b.x0, 26);
    ctx.fillStyle = PAL.standLip; ctx.fillRect(b.x0, y + 10, b.x1 - b.x0, 2.5);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(b.x0, y + 33, b.x1 - b.x0, 3);
  });
  ctx.fillStyle = 'rgba(15,22,34,0.55)'; ctx.fillRect(b.x0, top, b.x1 - b.x0, 14); // roof shadow
  ctx.fillStyle = '#7b8aa3'; ctx.fillRect(b.x0, top - 5, b.x1 - b.x0, 7);
  for (let x = b.x0 + 40; x < b.x1; x += 140) { ctx.fillStyle = 'rgba(15,22,34,0.35)'; ctx.fillRect(x, top + 14, 10, bottom - top - 14); }
}

/** Draw the far layer in world coordinates over the box. */
export function drawBack(ctx: Ctx, b: Box): void {
  sky(ctx, b);
  hills(ctx, b);
  floodlight(ctx, b.x0 + (b.x1 - b.x0) * 0.1);
  floodlight(ctx, b.x0 + (b.x1 - b.x0) * 0.9);
  stands(ctx, b);
}
