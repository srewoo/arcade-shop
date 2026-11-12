// Live-drawn gameplay props: ledges, breakable blocks, the grappling cord, power-up capsules, soft shadows.
import { CONFIG } from '../config';
import type { Block, Line, Pickup, PowerKind, Rect } from '../sim/types';
import { hexA } from './bubbleSprite';
import { POWER_COLORS, type ThemeArt } from './themes';
import { roundRect, vGrad } from './util';

export function drawPlatform(ctx: CanvasRenderingContext2D, r: Rect, art: ThemeArt): void {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, r.x + 2, r.y + r.h + 1, r.w - 4, 5, 2.5); ctx.fill();
  ctx.fillStyle = vGrad(ctx, r.y, r.y + r.h, [[0, art.ledgeHi], [0.3, art.ledge], [1, art.ledgeLo]]);
  roundRect(ctx, r.x, r.y, r.w, r.h, 3.5); ctx.fill();
  ctx.strokeStyle = 'rgba(10,8,24,0.65)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(r.x + 3, r.y + 1.2, r.w - 6, 1.2);
  ctx.fillStyle = art.ledgeLo;
  for (let x = r.x + 9; x < r.x + r.w - 5; x += 22) { ctx.beginPath(); ctx.arc(x, r.y + r.h / 2 + 0.5, 1.2, 0, Math.PI * 2); ctx.fill(); }
}

export function drawBlock(ctx: CanvasRenderingContext2D, b: Block, art: ThemeArt, wobble: number): void {
  ctx.save();
  ctx.translate(b.x + b.w / 2 + wobble, b.y + b.h / 2);
  const x = -b.w / 2, y = -b.h / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, x + 2, y + b.h - 2, b.w - 2, 5, 2.5); ctx.fill();
  ctx.fillStyle = vGrad(ctx, y, y + b.h, [[0, art.blockHi], [0.4, art.block], [1, art.blockLo]]);
  roundRect(ctx, x, y, b.w, b.h, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(10,8,24,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 4, y + b.h - 4); ctx.lineTo(x + 4, y + 4); ctx.lineTo(x + b.w - 5, y + 4); ctx.stroke();
  ctx.strokeStyle = art.blockLo; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + b.w / 2, y + 3); ctx.lineTo(x + b.w / 2, y + b.h - 3); ctx.moveTo(x + 3, y + b.h / 2); ctx.lineTo(x + b.w - 3, y + b.h / 2); ctx.stroke();
  const dmg = b.maxHp - b.hp;
  if (dmg > 0) {
    ctx.strokeStyle = 'rgba(10,8,24,0.85)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + b.w * 0.3, y + 2); ctx.lineTo(x + b.w * 0.45, y + b.h * 0.4); ctx.lineTo(x + b.w * 0.3, y + b.h * 0.7); ctx.lineTo(x + b.w * 0.5, y + b.h - 2);
    if (dmg > 1) { ctx.moveTo(x + b.w - 3, y + b.h * 0.3); ctx.lineTo(x + b.w * 0.6, y + b.h * 0.5); }
    ctx.stroke();
  }
  ctx.restore();
}

/** The cord, from the launcher to the tip with a small grapnel. `t` drives the moving twist. */
export function drawLine(ctx: CanvasRenderingContext2D, l: Line, tipY: number, t: number): void {
  const base = CONFIG.world.floorY - 30;
  const fade = l.stuck >= 0 && l.stuck < 0.4 ? Math.max(0.25, l.stuck / 0.4) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  const glow = ctx.createLinearGradient(l.x - 5, 0, l.x + 5, 0);
  glow.addColorStop(0, 'rgba(255,230,150,0)'); glow.addColorStop(0.5, 'rgba(255,230,150,0.42)'); glow.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(l.x - 5, tipY, 10, base - tipY);
  ctx.strokeStyle = 'rgba(40,20,10,0.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(l.x, base); ctx.lineTo(l.x, tipY); ctx.stroke();
  ctx.strokeStyle = '#ffeab0'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(l.x, base); ctx.lineTo(l.x, tipY); ctx.stroke();
  ctx.strokeStyle = '#c98a2c'; ctx.lineWidth = 2.6; ctx.setLineDash([2.5, 5]); ctx.lineDashOffset = -(t * 40) % 7.5;
  ctx.beginPath(); ctx.moveTo(l.x, base); ctx.lineTo(l.x, tipY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.globalAlpha = fade * 0.8;
  ctx.beginPath(); ctx.moveTo(l.x - 0.6, base); ctx.lineTo(l.x - 0.6, tipY); ctx.stroke();
  ctx.globalAlpha = fade;
  ctx.fillStyle = '#ffd25a'; ctx.strokeStyle = 'rgba(40,20,10,0.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(l.x, tipY - 5); ctx.lineTo(l.x + 4.5, tipY + 1.5); ctx.lineTo(l.x, tipY + 0.5); ctx.lineTo(l.x - 4.5, tipY + 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (l.stuck >= 0) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 14)})`;
    ctx.beginPath(); ctx.arc(l.x, tipY, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function glyph(ctx: CanvasRenderingContext2D, kind: PowerKind, r: number): void {
  ctx.strokeStyle = '#10142e'; ctx.fillStyle = '#10142e'; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'double') {
    ctx.moveTo(-r * 0.32, r * 0.5); ctx.lineTo(-r * 0.32, -r * 0.3); ctx.moveTo(r * 0.32, r * 0.5); ctx.lineTo(r * 0.32, -r * 0.3);
    ctx.moveTo(-r * 0.6, -r * 0.2); ctx.lineTo(-r * 0.32, -r * 0.55); ctx.lineTo(-r * 0.04, -r * 0.2);
    ctx.moveTo(r * 0.04, -r * 0.2); ctx.lineTo(r * 0.32, -r * 0.55); ctx.lineTo(r * 0.6, -r * 0.2);
    ctx.stroke();
  } else if (kind === 'sticky') {
    ctx.moveTo(0, -r * 0.55); ctx.quadraticCurveTo(r * 0.5, r * 0.05, r * 0.32, r * 0.35); ctx.quadraticCurveTo(0, r * 0.7, -r * 0.32, r * 0.35); ctx.quadraticCurveTo(-r * 0.5, r * 0.05, 0, -r * 0.55);
    ctx.fill();
  } else if (kind === 'slow') {
    ctx.moveTo(-r * 0.36, -r * 0.5); ctx.lineTo(r * 0.36, -r * 0.5); ctx.lineTo(-r * 0.36, r * 0.5); ctx.lineTo(r * 0.36, r * 0.5); ctx.closePath();
    ctx.stroke();
  } else {
    ctx.moveTo(0, -r * 0.58); ctx.lineTo(r * 0.5, -r * 0.34); ctx.quadraticCurveTo(r * 0.5, r * 0.35, 0, r * 0.62); ctx.quadraticCurveTo(-r * 0.5, r * 0.35, -r * 0.5, -r * 0.34); ctx.closePath();
    ctx.stroke();
  }
}

/** Capsule badge used both for falling pickups and the status chips. */
export function drawPowerBadge(ctx: CanvasRenderingContext2D, kind: PowerKind, x: number, y: number, r: number, t: number): void {
  const col = POWER_COLORS[kind];
  ctx.save();
  ctx.translate(x, y);
  const halo = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * (1.9 + 0.2 * Math.sin(t * 6)));
  halo.addColorStop(0, hexA(col, 0.55)); halo.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, col); g.addColorStop(1, hexA(col, 0.85));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#10142e'; ctx.lineWidth = 1.6; ctx.stroke();
  glyph(ctx, kind, r);
  ctx.restore();
}

export function drawPickup(ctx: CanvasRenderingContext2D, u: Pickup, x: number, y: number, t: number): void {
  const blink = u.life < 1.6 && Math.floor(t * 10) % 2 === 0;
  if (blink) return;
  drawPowerBadge(ctx, u.kind, x, y + Math.sin(t * 5 + x) * 1.2, CONFIG.power.size, t);
}

/** Soft contact shadow under a bubble, tighter and darker as it nears the floor. */
export function drawBubbleShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const floor = CONFIG.world.floorY;
  const h = Math.max(0, floor - (y + r));
  const k = Math.max(0.15, 1 - h / 230);
  ctx.fillStyle = `rgba(0,0,0,${(0.34 * k).toFixed(3)})`;
  ctx.beginPath(); ctx.ellipse(x, floor + 1.5, r * (0.55 + 0.5 * k), r * 0.17 * (0.6 + k * 0.5), 0, 0, Math.PI * 2); ctx.fill();
}
