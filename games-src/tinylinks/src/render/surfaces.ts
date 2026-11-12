// Static drawing of hazards, sand, slopes, posts, tee box and cup.
import { CONFIG } from '../config';
import type { Post, SandPatch, Shape, Slope, Hazard, Vec } from '../physics/types';
import { PAL } from './palette';
import { shapeBox, shapeCenter, shapePath } from './paths';
import { rng } from './rng';
import { textures } from './textures';

export function drawSand(ctx: CanvasRenderingContext2D, p: SandPatch, seed: number, assist: boolean): void {
  const box = shapeBox(p.shape);
  const c = shapeCenter(p.shape);
  ctx.save();
  shapePath(ctx, p.shape, 2.5);
  ctx.fillStyle = PAL.sandLight;
  ctx.fill();
  shapePath(ctx, p.shape);
  const g = ctx.createRadialGradient(c.x - box.w * 0.12, c.y - box.h * 0.15, 4, c.x, c.y, Math.max(box.w, box.h) * 0.6);
  g.addColorStop(0, PAL.sandLight); g.addColorStop(0.6, PAL.sand); g.addColorStop(1, PAL.sandDark);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  const pat = ctx.createPattern(textures().grain, 'repeat');
  if (pat) { ctx.fillStyle = pat; ctx.fillRect(box.x, box.y, box.w, box.h); }
  const r = rng(seed);
  ctx.strokeStyle = 'rgba(140,105,40,0.25)';
  ctx.lineWidth = 0.9;
  for (let k = 1; k <= 3; k++) {
    shapePath(ctx, p.shape, -k * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(255,250,220,0.8)' : 'rgba(110,80,30,0.45)';
    ctx.fillRect(box.x + r() * box.w, box.y + r() * box.h, 1.3, 1.3);
  }
  ctx.restore();
  shapePath(ctx, p.shape);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = PAL.sandEdge;
  if (assist) ctx.setLineDash([2, 3.5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawWaterBase(ctx: CanvasRenderingContext2D, h: Hazard, assist: boolean): void {
  const box = shapeBox(h.shape);
  const water = h.kind === 'water';
  ctx.save();
  shapePath(ctx, h.shape, 3);
  ctx.fillStyle = water ? PAL.waterRim : PAL.voidRim;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  ctx.fill();
  ctx.restore();
  shapePath(ctx, h.shape);
  const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.4, box.y + box.h);
  if (water) { g.addColorStop(0, PAL.waterMid); g.addColorStop(1, PAL.waterDeep); } else { g.addColorStop(0, PAL.voidMid); g.addColorStop(1, PAL.voidDark); }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  shapePath(ctx, h.shape);
  ctx.clip();
  // Inner shadow cast by the rim (top-left light).
  ctx.lineWidth = 9;
  ctx.strokeStyle = 'rgba(0,15,40,0.35)';
  ctx.translate(2.5, 3);
  shapePath(ctx, h.shape);
  ctx.stroke();
  ctx.restore();
  if (!water) drawHatch(ctx, h.shape);
  shapePath(ctx, h.shape);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = water ? '#8fb3c9' : '#6b3d17';
  if (assist) ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHatch(ctx: CanvasRenderingContext2D, s: Shape): void {
  const b = shapeBox(s);
  ctx.save();
  shapePath(ctx, s);
  ctx.clip();
  ctx.strokeStyle = 'rgba(196,122,58,0.4)';
  ctx.lineWidth = 1.4;
  for (let k = -b.h; k < b.w; k += 9) {
    ctx.beginPath(); ctx.moveTo(b.x + k, b.y + b.h); ctx.lineTo(b.x + k + b.h, b.y); ctx.stroke();
  }
  ctx.restore();
}

/** Soft brightness ramp across the slope; chevrons are animated per frame. */
export function drawSlopeBase(ctx: CanvasRenderingContext2D, s: Slope): void {
  const c = shapeCenter(s.shape);
  const b = shapeBox(s.shape);
  const m = Math.hypot(s.ax, s.ay) || 1;
  const ux = s.ax / m;
  const uy = s.ay / m;
  const half = Math.abs(ux) * b.w / 2 + Math.abs(uy) * b.h / 2;
  const g = ctx.createLinearGradient(c.x - ux * half, c.y - uy * half, c.x + ux * half, c.y + uy * half);
  g.addColorStop(0, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(0,30,10,0.2)');
  ctx.save();
  shapePath(ctx, s.shape);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(240,255,235,0.5)';
  ctx.stroke();
  ctx.restore();
}

export function drawPost(ctx: CanvasRenderingContext2D, p: Post): void {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(p.x + 3.5, p.y + 5, p.r + 1, p.r, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fill();
  const g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.4, 1, p.x, p.y, p.r * 1.1);
  g.addColorStop(0, PAL.postLight); g.addColorStop(0.55, PAL.post); g.addColorStop(1, PAL.postDark);
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = PAL.wallEdge; ctx.stroke();
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.58, 0, Math.PI * 2);
  ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(255,245,230,0.9)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(p.x - p.r * 0.28, p.y - p.r * 0.32, p.r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
  ctx.restore();
}

export function drawTee(ctx: CanvasRenderingContext2D, tee: Vec): void {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(tee.x - 17, tee.y - 17, 34, 34, 6);
  ctx.fillStyle = 'rgba(0,40,15,0.22)'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(243,247,236,0.75)'; ctx.stroke();
  for (const dy of [-1, 1]) {
    ctx.beginPath(); ctx.arc(tee.x - 17, tee.y + dy * 11, 2.6, 0, Math.PI * 2);
    ctx.arc(tee.x + 17, tee.y + dy * 11, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = PAL.chalk; ctx.fill();
  }
  ctx.restore();
}

export function drawCup(ctx: CanvasRenderingContext2D, cup: Vec): void {
  const r = CONFIG.cup.r;
  ctx.save();
  ctx.beginPath(); ctx.arc(cup.x, cup.y, r + 2.4, 0, Math.PI * 2);
  ctx.fillStyle = PAL.cupRim; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(cup.x - 2, cup.y - 2.5, 1, cup.x, cup.y, r);
  g.addColorStop(0, '#1b3a25'); g.addColorStop(1, PAL.cupDark);
  ctx.beginPath(); ctx.arc(cup.x, cup.y, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(cup.x, cup.y, r - 0.8, Math.PI * 0.95, Math.PI * 1.9);
  ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cup.x, cup.y, r + 1.2, 0, Math.PI * 2);
  ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(20,60,30,0.7)'; ctx.stroke();
  ctx.restore();
}
