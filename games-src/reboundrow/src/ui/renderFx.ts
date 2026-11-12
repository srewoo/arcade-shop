// Canvas drawing for render-only effects (particles, hit flashes, rings, popups, banner, life-lost vignette).
import { CONFIG } from '../config';
import { roundRect } from './drawBricks';
import type { Fx } from './fx';

export function drawParticles(ctx: CanvasRenderingContext2D, fx: Fx): void {
  for (const p of fx.particles) {
    const t = Math.max(0, p.life / p.max);
    ctx.globalAlpha = t;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    if (p.spark) {
      // Hot streak along the velocity vector.
      ctx.lineWidth = Math.max(1, p.size * 0.45 * t + 0.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045);
      ctx.stroke();
      continue;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.22);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function drawRings(ctx: CanvasRenderingContext2D, fx: Fx): void {
  for (const r of fx.rings) {
    const t = 1 - r.life / r.max;
    ctx.globalAlpha = (1 - t) * 0.8;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3 * (1 - t) + 0.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 6 + t * 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawHitFlashes(ctx: CanvasRenderingContext2D, fx: Fx): void {
  for (const f of fx.flashes) {
    const t = Math.max(0, f.life / CONFIG.fx.hitFlashSec);
    ctx.globalAlpha = t * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 14 * t;
    roundRect(ctx, f.x - CONFIG.field.brickW / 2 + 1.5, f.y - CONFIG.field.brickH / 2 + 1.5, CONFIG.field.brickW - 3, CONFIG.field.brickH - 3, 5);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

export function drawPopups(ctx: CanvasRenderingContext2D, fx: Fx): void {
  ctx.font = '800 20px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const p of fx.popups) {
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(8,12,34,0.9)';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x - 80, p.y - 12, 160, 10);
    ctx.clip();
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function drawBanner(ctx: CanvasRenderingContext2D, fx: Fx, w: number, h: number): void {
  const b = fx.banner;
  if (!b) return;
  const t = b.life / CONFIG.fx.bannerSec;
  const pop = fx.reduced ? 1 : 1 + Math.max(0, t - 0.8) * 1.5;
  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 3);
  ctx.translate(w / 2, h * 0.5);
  const band = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  band.addColorStop(0, 'rgba(8,12,34,0)');
  band.addColorStop(0.2, 'rgba(8,12,34,0.7)');
  band.addColorStop(0.8, 'rgba(8,12,34,0.7)');
  band.addColorStop(1, 'rgba(8,12,34,0)');
  ctx.fillStyle = band;
  ctx.fillRect(-w / 2, -38, w, 76);
  ctx.scale(pop, pop);
  ctx.font = '900 44px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 9;
  ctx.strokeStyle = 'rgba(8,12,34,0.9)';
  ctx.strokeText(b.text, 0, 0);
  ctx.shadowColor = b.color;
  ctx.shadowBlur = fx.reduced ? 0 : 18;
  ctx.fillStyle = b.color;
  ctx.fillText(b.text, 0, 0);
  ctx.restore();
}

/** Red edge vignette after losing a ball. Skipped under Reduce motion (it is a flash). */
export function drawLostFlash(ctx: CanvasRenderingContext2D, fx: Fx, w: number, h: number): void {
  if (fx.flash <= 0 || fx.reduced) return;
  const a = (fx.flash / CONFIG.fx.flashSec) * 0.6;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(255,60,90,0)');
  g.addColorStop(1, `rgba(255,60,90,${a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
