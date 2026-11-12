// Per-frame scenery that depends on game state: ball shadow, wind sock and streaks, aim reticle.
import { CONFIG } from '../config';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;

/** Ground shadow: shrinks and fades with height (frac 0 on the ground .. 1 high up). */
export function drawShadow(ctx: Ctx, x: number, frac: number): void {
  const k = 1 - frac * 0.62;
  const r = CONFIG.ball.radius * 1.05 * k;
  const y = CONFIG.world.groundY + 6;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `${PAL.shadow}${(0.5 * k).toFixed(3)})`); g.addColorStop(1, `${PAL.shadow}0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.5, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
}

/** Wind sock on a pole. `r` is the wind as -1..1; the sock lifts and points with the wind. */
export function drawSock(ctx: Ctx, x: number, r: number, t: number, animate: boolean): void {
  const baseY = 452; const topY = 318;
  ctx.fillStyle = PAL.pole; ctx.fillRect(x - 2, topY, 4, baseY - topY);
  ctx.fillStyle = '#9aa9b8'; ctx.beginPath(); ctx.arc(x, topY, 5, 0, Math.PI * 2); ctx.fill();
  const dir = r >= 0 ? 1 : -1;
  const lift = Math.min(1, Math.abs(r)) * 1.25; // 0 droops, ~1.25 rad is nearly level
  let px = x; let py = topY;
  for (let i = 0; i < 5; i++) {
    const flutter = animate ? Math.sin(t * 7 + i * 0.9) * 0.08 * Math.abs(r) : 0;
    const ang = Math.PI / 2 - lift + flutter * i; // from straight down toward horizontal
    const len = 15; const rad = 9 - i * 1.3;
    const ex = px + dir * Math.sin(Math.PI / 2 - ang) * len;
    const ey = py + Math.cos(Math.PI / 2 - ang) * len;
    ctx.strokeStyle = i % 2 ? PAL.sockBand : PAL.sock; ctx.lineWidth = rad * 2; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
    px = ex; py = ey;
  }
}

/** Faint streaks that blow across the court during a gust. */
export function drawStreaks(ctx: Ctx, r: number, t: number, w: number): void {
  const a = Math.min(1, Math.abs(r));
  if (a < 0.05) return;
  const dir = r > 0 ? 1 : -1;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const speed = 260 + (i % 4) * 90;
    const span = w + 200;
    const x = (((i * 137 + t * speed * dir) % span) + span) % span - 100;
    const y = 90 + ((i * 61) % 340);
    ctx.globalAlpha = 0.18 + a * 0.35;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * (26 + a * 40), y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawReticle(ctx: Ctx, x: number, y: number, t: number, animate: boolean): void {
  const r = CONFIG.ball.radius * CONFIG.hit.slop;
  const pulse = animate ? 1 + Math.sin(t * 6) * 0.04 : 1;
  for (const [color, w] of [[PAL.reticleInk, 5.5], [PAL.reticle, 2.5]] as const) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
  }
}
