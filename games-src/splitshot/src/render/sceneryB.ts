// Static scenery, part 2: lantern caves, storm cliffs, aurora floe.
import { CONFIG } from '../config';
import { vGrad } from './util';
import { glow, ridge, stars, streak, type Scene } from './sceneKit';

const FLOOR = CONFIG.world.floorY;

export const LANTERNS = [90, 255, 420, 585] as const;

function stalactites(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  ctx.fillStyle = art.near;
  for (let x = x0 - 10; x < x1 + 10;) {
    const w = 18 + rnd() * 30;
    const h = 24 + rnd() * 60;
    ctx.beginPath();
    ctx.moveTo(x, y0 - 5); ctx.lineTo(x + w, y0 - 5); ctx.lineTo(x + w * 0.55, y0 + 40 + h); ctx.closePath();
    ctx.fill();
    x += w * 0.8;
  }
  ctx.fillRect(x0, y0 - 5, x1 - x0, 45);
}

function crystals(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  for (let i = 0; i < 16; i++) {
    const x = x0 + rnd() * (x1 - x0), y = art.horizon + 12 + rnd() * 30;
    const h = 18 + rnd() * 34, w = 6 + rnd() * 7;
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(200,90,150,0.62)' : 'rgba(120,100,220,0.58)';
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.3, y - h); ctx.lineTo(x + w * 0.5, y - h * 0.8); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,240,0.28)';
    ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h); ctx.lineTo(x + w * 0.1, y - h * 0.9); ctx.lineTo(x - w * 0.1, y); ctx.lineTo(x - w, y); ctx.closePath(); ctx.fill();
  }
}

export function lantern(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  ctx.fillStyle = vGrad(ctx, y0, FLOOR, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, FLOOR - y0 + 2);
  ridge(sc, art.horizon - 70, 50, 0.008, 0.7, art.far, FLOOR);
  for (let x = x0 + 20; x < x1; x += 120 + rnd() * 30) {
    ctx.fillStyle = art.mid;
    ctx.fillRect(x, art.horizon - 120, 26, 140);
    ctx.fillStyle = art.midHi; ctx.globalAlpha = 0.35; ctx.fillRect(x, art.horizon - 120, 4, 140); ctx.globalAlpha = 1;
  }
  ridge(sc, art.horizon + 8, 22, 0.014, 2.8, art.mid, FLOOR, 'rgba(232,160,140,0.3)');
  crystals(sc);
  ridge(sc, art.horizon + 30, 10, 0.03, 0.2, art.near, FLOOR);
  stalactites(sc);
  for (const lx of LANTERNS) {
    const ly = 82 + (lx % 3) * 14;
    glow(ctx, lx, ly, 120, art.glow, 0.5);
    ctx.strokeStyle = '#2a1a22'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lx, y0); ctx.lineTo(lx, ly - 12); ctx.stroke();
    ctx.fillStyle = '#4a2c34'; ctx.fillRect(lx - 7, ly - 12, 14, 4);
    ctx.fillStyle = '#ffd37a'; ctx.beginPath(); ctx.roundRect(lx - 6, ly - 8, 12, 16, 3); ctx.fill();
    ctx.fillStyle = '#fff6d0'; ctx.fillRect(lx - 2, ly - 4, 4, 8);
    ctx.fillStyle = '#4a2c34'; ctx.fillRect(lx - 7, ly + 7, 14, 3);
  }
}

export function storm(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  const H = art.horizon;
  ctx.fillStyle = vGrad(ctx, y0, H + 6, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, H - y0 + 8);
  for (let i = 0; i < 14; i++) {
    streak(ctx, x0 + rnd() * (x1 - x0), y0 + 30 + rnd() * (H - y0 - 90), 60 + rnd() * 90, 14 + rnd() * 16, i % 3 === 0 ? '#0e141c' : '#1c2634', 0.55);
  }
  glow(ctx, 330, H - 50, 260, art.glow, 0.16);
  ctx.fillStyle = vGrad(ctx, H, FLOOR, [[0, '#4a5c72'], [0.5, '#26323f'], [1, '#121820']]);
  ctx.fillRect(x0, H, x1 - x0, FLOOR - H + 2);
  for (let i = 0; i < 40; i++) {
    const y = H + 4 + rnd() * (FLOOR - H - 12), x = x0 + rnd() * (x1 - x0);
    ctx.fillStyle = 'rgba(200,225,255,0.22)';
    ctx.fillRect(x, y, 8 + rnd() * 20 * ((y - H) / 60 + 0.5), 1.3);
  }
  ridge(sc, H + 6, 16, 0.014, 0.6, art.mid, FLOOR);
  cliff(sc, x0 - 20, 130, true);
  cliff(sc, x1 + 20, 110, false);
}

function cliff(sc: Scene, edge: number, w: number, left: boolean): void {
  const { ctx, art, y0 } = sc;
  const top = art.horizon - 74;
  const d = left ? 1 : -1;
  ctx.fillStyle = art.near;
  ctx.beginPath();
  ctx.moveTo(edge, FLOOR); ctx.lineTo(edge, y0 < top ? top - 30 : y0);
  ctx.lineTo(edge + d * w * 0.55, top - 6); ctx.lineTo(edge + d * w * 0.75, top + 26); ctx.lineTo(edge + d * w * 0.95, top + 60);
  ctx.lineTo(edge + d * w * 1.25, art.horizon + 20); ctx.lineTo(edge + d * w * 1.45, FLOOR);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = art.midHi; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.3; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = art.near;
  ctx.fillRect(edge + d * w * 0.12 - (left ? 0 : 14), top - 36, 14, 34);
  ctx.fillRect(edge + d * w * 0.12 - (left ? 2 : 16), top - 40, 18, 5);
}

export function aurora(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  const H = art.horizon;
  ctx.fillStyle = vGrad(ctx, y0, H + 4, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, H - y0 + 6);
  stars(sc, 120, H - 40);
  for (let b = 0; b < 3; b++) {
    const baseY = 70 + b * 26;
    const g = vGrad(ctx, baseY - 70, baseY + 60, [[0, 'rgba(125,255,200,0)'], [0.5, b === 1 ? 'rgba(160,120,255,0.38)' : 'rgba(125,255,200,0.4)'], [1, 'rgba(125,255,200,0)']]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0, baseY + 60);
    for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, baseY + Math.sin(x * 0.012 + b * 1.9) * 28 + Math.sin(x * 0.031 + b) * 8);
    ctx.lineTo(x1, baseY + 60); ctx.closePath(); ctx.fill();
  }
  for (let x = x0 - 30; x < x1 + 30; x += 40 + rnd() * 40) {
    const h = 50 + rnd() * 90, w = 40 + rnd() * 40, by = H + 6;
    ctx.fillStyle = art.mid;
    ctx.beginPath(); ctx.moveTo(x - w, by); ctx.lineTo(x, by - h); ctx.lineTo(x + w, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = art.midHi; ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.moveTo(x - w, by); ctx.lineTo(x, by - h); ctx.lineTo(x - w * 0.1, by - h * 0.3); ctx.lineTo(x - w * 0.35, by); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = vGrad(ctx, H, FLOOR, [[0, '#14385e'], [1, '#0a1f3a']]);
  ctx.fillRect(x0, H + 4, x1 - x0, FLOOR - H);
  for (let i = 0; i < 30; i++) {
    const x = x0 + rnd() * (x1 - x0), y = H + 8 + rnd() * (FLOOR - H - 14);
    ctx.fillStyle = 'rgba(125,255,200,0.16)';
    ctx.fillRect(x, y, 10 + rnd() * 40, 1.4);
  }
  for (const [bx, s] of [[130, 1], [470, 0.8]] as const) {
    ctx.fillStyle = art.midHi;
    ctx.beginPath(); ctx.moveTo(bx - 40 * s, H + 22); ctx.lineTo(bx - 14 * s, H - 8 * s + 12); ctx.lineTo(bx + 6 * s, H + 2); ctx.lineTo(bx + 30 * s, H - 14 * s + 14); ctx.lineTo(bx + 46 * s, H + 22); ctx.closePath(); ctx.fill();
  }
}
