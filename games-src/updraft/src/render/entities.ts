// Ghost craft and coins. The player's craft lives in craft.ts.
import { CONFIG } from '../config';
import type { SimState } from '../sim';
import type { World } from '../world';
import { drawCraft } from './craft';
import type { Palette, View } from './view';

export { CRAFT_ART, drawCraft } from './craft';

export function drawGhost(ctx: CanvasRenderingContext2D, ghost: SimState, alpha: number, camX: number, pal: Palette): void {
  if (!ghost.alive) return;
  const x = ghost.prevDist + (ghost.dist - ghost.prevDist) * alpha;
  const y = ghost.prevY + (ghost.y - ghost.prevY) * alpha;
  drawCraft(ctx, x - camX, y, ghost.vy, pal, { ghost: true });
}

function coin(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, pal: Palette, assist: boolean, sparkle: number): void {
  const R = CONFIG.world.coinR;
  const halo = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 2.4);
  halo.addColorStop(0, 'rgba(255, 210, 74, 0.45)');
  halo.addColorStop(1, 'rgba(255, 210, 74, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, R * 2.4, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
  g.addColorStop(0, '#fff3b0');
  g.addColorStop(0.5, pal.coin);
  g.addColorStop(1, '#d68a00');
  ctx.beginPath();
  ctx.ellipse(x, y, R * k, R, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = pal.coinInk;
  ctx.lineWidth = assist ? 3 : 1.6;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, R * k, R, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(120,70,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y, R * k * 0.68, R * 0.68, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x, y, R * k * 0.82, R * 0.82, 0, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x, y - R * 0.4);
  ctx.lineTo(x, y + R * 0.4);
  ctx.strokeStyle = pal.coinInk;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (sparkle > 0.8) {
    ctx.strokeStyle = '#fffbe0';
    ctx.lineWidth = 1.4;
    const s = R * 1.1 * (sparkle - 0.8) * 5;
    ctx.beginPath();
    ctx.moveTo(x + R * 0.5 - s, y - R * 0.6); ctx.lineTo(x + R * 0.5 + s, y - R * 0.6);
    ctx.moveTo(x + R * 0.5, y - R * 0.6 - s); ctx.lineTo(x + R * 0.5, y - R * 0.6 + s);
    ctx.stroke();
  }
}

export function drawCoins(
  ctx: CanvasRenderingContext2D, v: View, pal: Palette, world: World, taken: ReadonlySet<number>,
  camX: number, time: number, spin: boolean, assist: boolean,
): void {
  for (const c of world.coinsIn(camX - 20, camX + v.wv + 20)) {
    if (taken.has(c.id)) continue;
    const k = spin ? Math.max(0.25, Math.abs(Math.cos(time * 3 + c.id * 0.7))) : 1;
    const sparkle = spin ? Math.max(0, Math.sin(time * 2.2 + c.id * 1.9)) : 0;
    coin(ctx, c.x - camX, c.y, k, pal, assist, sparkle);
  }
}
