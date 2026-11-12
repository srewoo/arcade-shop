// Shots and pickups. Plane and enemy art lives in renderPlayer.ts / renderEnemies.ts.
import { PICKUP_COLOUR, PICKUP_LETTER, type Palette } from './palette';
import { dot, glow, vgrad, type Ctx } from './renderKit';
import type { Pickup } from './types';

/** Floating power-up orb: shaded sphere, orbiting ring, glints and the kind letter. */
export function drawPickup(c: Ctx, k: Pickup, x: number, y: number, t: number): void {
  const bob = Math.sin(t * 5 + k.t * 4) * 2;
  const col = PICKUP_COLOUR[k.kind];
  glow(c, x, y + bob, 30, 'rgba(255,255,255,0.4)');
  c.save();
  c.translate(x, y + bob);
  const orb = c.createRadialGradient(-4, -5, 1, 0, 0, 15);
  orb.addColorStop(0, '#ffffff');
  orb.addColorStop(0.3, col);
  orb.addColorStop(1, '#1b2a4a');
  c.beginPath();
  c.arc(0, 0, 14, 0, Math.PI * 2);
  c.fillStyle = orb;
  c.fill();
  c.lineWidth = 2.5;
  c.strokeStyle = '#06182f';
  c.stroke();
  c.save();
  c.rotate(t * 2.2 + k.t);
  c.beginPath();
  c.arc(0, 0, 18 + Math.sin(t * 6 + k.t * 4) * 1.5, 0, Math.PI * 2);
  c.lineWidth = 1.6;
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.setLineDash([10, 7]);
  c.stroke();
  c.restore();
  c.beginPath();
  c.ellipse(-4.5, -6, 4, 2.2, -0.6, 0, Math.PI * 2);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fill();
  c.fillStyle = '#06182f';
  c.font = 'bold 16px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(PICKUP_LETTER[k.kind], 0, 1);
  c.restore();
}

/** Player shot: a glowing capsule with a short trail. */
export function drawPlayerShot(c: Ctx, x: number, y: number, p: Palette): void {
  glow(c, x, y, 11, 'rgba(120,220,255,0.6)');
  const g = vgrad(c, y - 10, y + 16, '#ffffff', 'rgba(53,194,255,0)');
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(x - 2.4, y - 10, 4.8, 26, 2.4);
  c.fill();
  c.fillStyle = p.playerShot;
  c.beginPath();
  c.roundRect(x - 1.4, y - 9, 2.8, 12, 1.4);
  c.fill();
}

export function drawEnemyShot(c: Ctx, x: number, y: number, r: number, p: Palette, assist: boolean): void {
  glow(c, x, y, r * 3.6, 'rgba(255,120,60,0.4)');
  c.beginPath();
  if (assist) {
    c.moveTo(x, y - r - 2);
    c.lineTo(x + r + 2, y);
    c.lineTo(x, y + r + 2);
    c.lineTo(x - r - 2, y);
    c.closePath();
  } else c.arc(x, y, r + 1, 0, Math.PI * 2);
  c.fillStyle = p.enemyShot;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = p.enemyShotRing;
  c.stroke();
  const core = c.createRadialGradient(x, y, 0, x, y, r * 0.6);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(1, p.enemyShotCore);
  c.fillStyle = core;
  c.beginPath();
  c.arc(x, y, r * 0.55, 0, Math.PI * 2);
  c.fill();
  dot(c, x - r * 0.3, y - r * 0.3, r * 0.14, 'rgba(255,255,255,0.9)');
}
