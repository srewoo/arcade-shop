// The lighthouse keeper "Bosun": layered path art with idle, walk, aim/fire, hurt and cheer poses.
// Local origin is the centre of the feet; up is negative y; the hero faces right when facing = 1.
import { clamp } from './util';

export interface HeroPose {
  x: number;
  facing: 1 | -1;
  moving: boolean;
  /** Seconds, drives idle/walk cycles. */
  t: number;
  /** True while the cord is out or just fired: arms up, launcher aimed at the sky. */
  aiming: boolean;
  /** 0..1 recoil kick right after a shot. */
  kick: number;
  hurt: boolean;
  cheer: boolean;
  shield: boolean;
  blink: boolean;
}

const COAT = '#ffc83a', COAT_D = '#d98d10', COAT_L = '#ffe58a', NAVY = '#1c2b58', SKIN = '#f4cba2', BRASS = '#d9a441', INK = '#1b1230';

function limb(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, w: number, color: string): void {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}

function legs(ctx: CanvasRenderingContext2D, p: HeroPose, swing: number): void {
  for (const side of [-1, 1]) {
    const a = p.moving ? Math.sin(p.t * 11 + (side > 0 ? 0 : Math.PI)) * 0.75 : 0.06 * side;
    const lift = p.moving ? Math.max(0, Math.cos(p.t * 11 + (side > 0 ? 0 : Math.PI))) * 2 : 0;
    const hx = side * 3, hy = -12;
    const fx = hx + Math.sin(a) * 8 * (swing || 1), fy = hy + Math.cos(a) * 11.4 - lift;
    limb(ctx, hx, hy, fx, fy - 2, 4.6, NAVY);
    ctx.fillStyle = '#3a2418';
    ctx.beginPath(); ctx.ellipse(fx + p.facing * 1.6, fy - 1, 4.6, 2.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(fx + p.facing * 1 - 2, fy - 3, 3.6, 0.9);
  }
}

function coat(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(-9, -28, 9, -10);
  g.addColorStop(0, COAT_L); g.addColorStop(0.35, COAT); g.addColorStop(1, COAT_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-7.5, -28); ctx.quadraticCurveTo(0, -30.5, 7.5, -28);
  ctx.lineTo(10, -10.5); ctx.quadraticCurveTo(0, -8.5, -10, -10.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.strokeStyle = COAT_D; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-3, -26); ctx.lineTo(-4.6, -11); ctx.moveTo(4, -26); ctx.lineTo(5, -11); ctx.stroke();
  ctx.fillStyle = '#3a2418'; ctx.fillRect(-9, -19, 18, 2.8);
  ctx.fillStyle = BRASS; ctx.fillRect(-2, -19.4, 4, 3.6);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, -24.5, 0.9, 0, Math.PI * 2); ctx.arc(0, -22.2, 0.9, 0, Math.PI * 2); ctx.fill();
}

function launcher(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#7a5a22'; ctx.fillRect(x - 2.2, y - 11, 4.4, 12);
  ctx.fillStyle = BRASS; ctx.fillRect(x - 1.6, y - 12, 3.2, 12);
  ctx.fillStyle = '#fff3c0'; ctx.fillRect(x - 0.9, y - 12, 0.8, 11);
  ctx.fillStyle = '#6a4c1c';
  ctx.beginPath(); ctx.arc(x, y - 2, 4.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(x, y - 2, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a4c1c'; ctx.beginPath(); ctx.arc(x, y - 2, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - 12.4, 1.1, 0, Math.PI * 2); ctx.fill();
}

function arms(ctx: CanvasRenderingContext2D, p: HeroPose): void {
  const f = p.facing;
  const up = p.aiming || p.cheer;
  const sx = 6.4 * f, sy = -25;
  const kick = p.kick * 2.2;
  if (p.hurt) {
    limb(ctx, sx, sy, sx + f * 9, sy - 7, 4, COAT_D); limb(ctx, -sx, sy, -sx - f * 9, sy - 7, 4, COAT_D);
    return;
  }
  if (p.cheer) {
    const w = Math.sin(p.t * 9) * 2;
    limb(ctx, sx, sy, sx + f * 3, sy - 13 + w, 4, COAT); limb(ctx, -sx, sy, -sx - f * 3, sy - 13 - w, 4, COAT_D);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(sx + f * 3, sy - 14 + w, 2.4, 0, Math.PI * 2); ctx.arc(-sx - f * 3, sy - 14 - w, 2.4, 0, Math.PI * 2); ctx.fill();
    return;
  }
  limb(ctx, -sx, sy, up ? -1.5 * f : -sx - f * 1.5, up ? -33 : -17, 4, COAT_D);
  if (up) {
    launcher(ctx, 0, -29 + kick);
    limb(ctx, sx, sy, 1.2 * f, -30 + kick, 4.2, COAT);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1.2 * f, -30 + kick, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    launcher(ctx, sx + f * 4, -17);
    limb(ctx, sx, sy, sx + f * 4, -18, 4.2, COAT);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(sx + f * 4, -18, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

function head(ctx: CanvasRenderingContext2D, p: HeroPose): void {
  const f = p.facing;
  ctx.fillStyle = '#25b5a8'; ctx.beginPath(); ctx.ellipse(0, -28.2, 6.6, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -33.2, 6.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.5; ctx.lineWidth = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
  const bg = ctx.createLinearGradient(0, -33, 0, -23);
  bg.addColorStop(0, '#fbf7ee'); bg.addColorStop(1, '#c9c4b8');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-6.2, -33.5); ctx.quadraticCurveTo(-8, -26, -2.5, -23.6); ctx.quadraticCurveTo(0, -22.2, 2.5, -23.6); ctx.quadraticCurveTo(8, -26, 6.2, -33.5);
  ctx.quadraticCurveTo(3, -29.5, 0, -30.5); ctx.quadraticCurveTo(-3, -29.5, -6.2, -33.5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8a08a'; ctx.beginPath(); ctx.arc(f * 1.6, -32.6, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  const ey = p.hurt ? 0.5 : p.blink ? 0.35 : 1.5;
  ctx.beginPath(); ctx.ellipse(f * 2.8 - 2.6, -34.6, 0.95, ey, 0, 0, Math.PI * 2); ctx.ellipse(f * 2.8 + 2.6, -34.6, 0.95, ey, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-4.4, -36.4); ctx.lineTo(-1.2, -36.1); ctx.moveTo(1.2, -36.1); ctx.lineTo(4.4, -36.4); ctx.stroke();
}

function hat(ctx: CanvasRenderingContext2D, p: HeroPose): void {
  const f = p.facing;
  ctx.fillStyle = COAT_D;
  ctx.beginPath(); ctx.moveTo(-f * 5, -38); ctx.quadraticCurveTo(-f * 12, -36, -f * 12.5, -29.5); ctx.quadraticCurveTo(-f * 8, -33, -f * 4.5, -34.5); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(0, -45, 0, -37);
  g.addColorStop(0, COAT_L); g.addColorStop(1, COAT);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, -37.2, 10.2, 2.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6.8, -37.4); ctx.quadraticCurveTo(-6.8, -45.6, 0, -45.6); ctx.quadraticCurveTo(6.8, -45.6, 6.8, -37.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.globalAlpha = 0.5; ctx.lineWidth = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a2418'; ctx.fillRect(-6.8, -39.4, 13.6, 1.8);
  const lx = f * 4.2, ly = -42;
  const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, 6);
  gl.addColorStop(0, 'rgba(210,250,255,0.95)'); gl.addColorStop(1, 'rgba(120,220,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(lx - 6, ly - 6, 12, 12);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, Math.PI * 2); ctx.stroke();
}

export function drawHero(ctx: CanvasRenderingContext2D, p: HeroPose, floorY: number, alpha = 1): void {
  ctx.save();
  ctx.translate(p.x, floorY);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0.8, 10.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  const bob = p.cheer ? -Math.abs(Math.sin(p.t * 9)) * 4 : p.moving ? -Math.abs(Math.sin(p.t * 11)) * 1.2 : Math.sin(p.t * 2.2) * 0.45;
  ctx.globalAlpha = alpha;
  ctx.translate(0, bob);
  legs(ctx, p, 1);
  coat(ctx);
  arms(ctx, p);
  head(ctx, p);
  hat(ctx, p);
  if (p.hurt) { ctx.fillStyle = 'rgba(255,70,70,0.28)'; ctx.beginPath(); ctx.ellipse(0, -22, 11, 24, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (p.shield) drawShield(ctx, p, floorY);
}

function drawShield(ctx: CanvasRenderingContext2D, p: HeroPose, floorY: number): void {
  const pulse = 1 + Math.sin(p.t * 5) * 0.03;
  const r = 24 * pulse;
  ctx.save();
  ctx.translate(p.x, floorY - 21);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, 'rgba(255,240,170,0.35)'); g.addColorStop(0.8, 'rgba(255,212,90,0.2)'); g.addColorStop(1, 'rgba(255,212,90,0.55)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,236,160,0.95)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 3.6, 4.5); ctx.stroke();
  ctx.restore();
}

export const kickOf = (shotAge: number): number => clamp(1 - shotAge / 0.14, 0, 1);
