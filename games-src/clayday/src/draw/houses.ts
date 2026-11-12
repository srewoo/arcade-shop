// Trap houses: concrete bunkers with a low sloped roof, a dark launch slot on top (where clays emerge)
// and a warning lamp. The slot sits at the same place the clays launch from.
import { PALETTE as P } from '../palette';
import type { World } from '../world';

export function house(ctx: CanvasRenderingContext2D, w: World, cx: number): void {
  const bw = Math.max(90, w.w * 0.1);
  const top = w.launchY + 12;
  const bh = w.h * 0.13;
  const left = cx - bw / 2;
  ctx.fillStyle = 'rgba(14,30,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx + 10, top + bh + 3, bw * 0.62, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const wall = ctx.createLinearGradient(left, 0, left + bw, 0);
  wall.addColorStop(0, P.barn);
  wall.addColorStop(0.5, '#b04838');
  wall.addColorStop(1, P.barnDark);
  ctx.fillStyle = wall;
  ctx.fillRect(left, top, bw, bh);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = top + 8; y < top + bh * 0.8; y += 9) ctx.fillRect(left, y, bw, 1.5);
  ctx.fillStyle = P.barnDark;
  ctx.fillRect(left, top + bh * 0.8, bw, bh * 0.2);
  const roof = ctx.createLinearGradient(0, top - 10, 0, top + 8);
  roof.addColorStop(0, '#6a5a50');
  roof.addColorStop(1, P.roof);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(left - 7, top + 6);
  ctx.lineTo(left + 8, top - 9);
  ctx.lineTo(left + bw - 8, top - 9);
  ctx.lineTo(left + bw + 7, top + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(left + 8, top - 9, bw - 16, 2);
  const door = ctx.createLinearGradient(0, top + bh * 0.35, 0, top + bh);
  door.addColorStop(0, '#4a1a14');
  door.addColorStop(1, '#2a0e0a');
  ctx.fillStyle = door;
  ctx.fillRect(cx - bw * 0.16, top + bh * 0.35, bw * 0.32, bh * 0.65);
  ctx.fillStyle = '#d8c46a';
  ctx.fillRect(cx + bw * 0.1, top + bh * 0.62, 3, 5);
  // Launch slot: dark mouth with a lit lip.
  ctx.fillStyle = P.clayOutline;
  ctx.fillRect(cx - 28, top - 16, 56, 11);
  ctx.fillStyle = P.clayRim;
  ctx.fillRect(cx - 28, top - 17, 56, 2.5);
  ctx.fillStyle = P.barnDark;
  ctx.fillRect(cx - 20, top - 5, 40, 3);
  ctx.fillStyle = '#ff5a3c';
  ctx.beginPath();
  ctx.arc(left + bw - 12, top + 14, 3.2, 0, Math.PI * 2);
  ctx.fill();
}
