// The double-barrelled gun (first person) and its muzzle flash. The gun art (gunArt.ts) is baked once per
// size and blitted rotated toward the aim point; the muzzle flash is live.
import { PALETTE as P } from '../palette';
import type { World } from '../world';
import { paintGun } from './gunArt';
import { baked } from './sprites';

export interface GunTip {
  readonly tipX: number;
  readonly tipY: number;
  readonly angle: number;
}

/** Over-and-under style barrels pointing at the aim point, kicking back on recoil (0..1). */
export function drawGun(ctx: CanvasRenderingContext2D, w: World, aimX: number, aimY: number, recoil: number): GunTip {
  const u = Math.max(0.85, w.h / 640);
  const ox = w.w * 0.5 + (aimX - w.w * 0.5) * 0.18;
  const oy = w.h * 0.99;
  const ang = Math.atan2(aimY - oy, aimX - ox);
  const len = Math.max(w.arc * 0.55, w.h * 0.34);
  const kick = recoil * 30 * u;
  const padX = 62 * u;
  const top = len + 24 * u;
  const bottom = 230 * u;
  const sprite = baked(`gun|${u.toFixed(2)}|${Math.round(len)}`, padX * 2, top + bottom, (g) => {
    g.translate(padX, top);
    paintGun(g, u, len);
  }, 2);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(ang + Math.PI / 2 + recoil * 0.035 * (aimX < ox ? -1 : 1));
  ctx.translate(0, kick);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(6 * u, 6 * u, 50 * u, 22 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(sprite, -padX, -top, padX * 2, top + bottom);
  ctx.restore();
  const k = len - kick;
  return { tipX: ox + Math.cos(ang) * k, tipY: oy + Math.sin(ang) * k, angle: ang };
}

/** Starburst muzzle flash; `amount` is 1 at the shot and falls to 0. Not drawn under Reduce motion (amount stays 0). */
export function drawMuzzleFlash(ctx: CanvasRenderingContext2D, tip: GunTip, amount: number, scale: number): void {
  if (amount <= 0) return;
  const size = (46 + 26 * amount) * Math.max(0.85, 1 / Math.max(scale, 0.5)) ** 0.3;
  ctx.save();
  ctx.translate(tip.tipX, tip.tipY);
  ctx.rotate(tip.angle + Math.PI / 2);
  ctx.globalAlpha = Math.min(1, amount * 1.3);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, size);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.3, P.flash);
  glow.addColorStop(0.65, 'rgba(255,160,40,0.55)');
  glow.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = P.flash;
  ctx.beginPath();
  const spikes = 9;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? size * (i % 4 === 0 ? 1.25 : 0.95) : size * 0.32;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.35);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
