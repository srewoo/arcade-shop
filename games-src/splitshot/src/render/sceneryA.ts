// Static scenery, part 1: harbour dusk, coral shallows, kelp forest. Each paints sky/water down to the floor line.
import { CONFIG } from '../config';
import { vGrad } from './util';
import { glow, ridge, stars, streak, type Scene } from './sceneKit';

const FLOOR = CONFIG.world.floorY;

export const LIGHTHOUSE = { x: 566, lampY: 178 } as const;

function houses(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  const base = art.horizon + 12;
  for (let x = x0 - 10; x < x1 + 20;) {
    const w = 22 + rnd() * 20;
    const h = 26 + rnd() * 36;
    if (Math.abs(x + w / 2 - LIGHTHOUSE.x) < 46) { x += w + 4; continue; }
    ctx.fillStyle = art.mid;
    ctx.fillRect(x, base - h, w, h);
    ctx.beginPath();
    ctx.moveTo(x - 3, base - h);
    ctx.lineTo(x + w / 2, base - h - 14 - rnd() * 8);
    ctx.lineTo(x + w + 3, base - h);
    ctx.closePath();
    ctx.fillStyle = art.near;
    ctx.fill();
    ctx.strokeStyle = art.midHi;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (let wy = base - h + 8; wy < base - 8; wy += 12) {
      for (let wx = x + 5; wx < x + w - 6; wx += 9) {
        if (rnd() < 0.45) { ctx.fillStyle = rnd() < 0.8 ? '#ffd27a' : '#ff9a62'; ctx.fillRect(wx, wy, 4, 5); }
      }
    }
    x += w + 3 + rnd() * 6;
  }
}

function lighthouse(sc: Scene): void {
  const { ctx, art } = sc;
  const { x, lampY } = LIGHTHOUSE;
  const base = art.horizon + 12;
  ctx.fillStyle = art.near;
  ctx.beginPath();
  ctx.moveTo(x - 36, base + 4); ctx.lineTo(x - 22, base - 14); ctx.lineTo(x + 22, base - 14); ctx.lineTo(x + 36, base + 4);
  ctx.closePath(); ctx.fill();
  const bands = 6;
  const top = lampY + 20;
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands, t1 = (i + 1) / bands;
    const yA = top + (base - 14 - top) * t0, yB = top + (base - 14 - top) * t1;
    const wA = 9 + 8 * t0, wB = 9 + 8 * t1;
    ctx.fillStyle = i % 2 === 0 ? '#d8cbb4' : '#b4405a';
    ctx.beginPath(); ctx.moveTo(x - wA, yA); ctx.lineTo(x + wA, yA); ctx.lineTo(x + wB, yB); ctx.lineTo(x - wB, yB); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = art.near;
  ctx.fillRect(x - 15, top - 3, 30, 5);
  ctx.fillStyle = '#3a2a4c';
  ctx.fillRect(x - 9, lampY, 18, 20);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(x - 6, lampY + 3, 12, 14);
  ctx.fillStyle = '#b4405a';
  ctx.beginPath(); ctx.moveTo(x - 12, lampY); ctx.lineTo(x, lampY - 15); ctx.lineTo(x + 12, lampY); ctx.closePath(); ctx.fill();
  glow(ctx, x, lampY + 10, 46, '#ffe0a0', 0.6);
}

function harbourSea(sc: Scene): void {
  const { ctx, x0, x1, art, rnd } = sc;
  const H = art.horizon + 12;
  ctx.fillStyle = vGrad(ctx, H, FLOOR, [[0, '#4a3068'], [0.5, '#2a2050'], [1, '#161238']]);
  ctx.fillRect(x0, H, x1 - x0, FLOOR - H + 2);
  for (let i = 0; i < 46; i++) {
    const y = H + 3 + rnd() * (FLOOR - H - 10);
    const near = (y - H) / (FLOOR - H);
    const x = 420 + (rnd() - 0.5) * (90 + near * 190);
    ctx.fillStyle = art.glow;
    ctx.globalAlpha = 0.18 + rnd() * 0.3 * (1 - near * 0.5);
    ctx.fillRect(x, y, 6 + rnd() * 22 * (0.4 + near), 1 + near * 1.4);
  }
  ctx.globalAlpha = 1;
  for (const [bx, s] of [[150, 1], [340, 0.7]] as const) {
    ctx.fillStyle = art.near;
    ctx.beginPath(); ctx.moveTo(bx - 16 * s, H + 8); ctx.lineTo(bx + 16 * s, H + 8); ctx.lineTo(bx + 11 * s, H + 14 * s + 8); ctx.lineTo(bx - 12 * s, H + 14 * s + 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx, H + 8); ctx.lineTo(bx, H - 26 * s); ctx.lineTo(bx + 15 * s, H + 6); ctx.closePath(); ctx.fill();
  }
}

export function harbour(sc: Scene): void {
  const { ctx, x0, x1, y0, art } = sc;
  const H = art.horizon;
  ctx.fillStyle = vGrad(ctx, y0, H + 12, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, H - y0 + 14);
  stars(sc, 70, 150);
  glow(ctx, 420, H, 300, art.glow, 0.6);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, H + 12 - y0); ctx.clip();
  ctx.fillStyle = '#ffd9a0'; ctx.beginPath(); ctx.arc(420, H + 8, 30, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  streak(ctx, 150, 92, 70, 6, '#ff9f8a', 0.5);
  streak(ctx, 300, 130, 90, 7, '#ffb99a', 0.45);
  streak(ctx, 480, 70, 60, 5, '#b78ad6', 0.5);
  ridge(sc, H - 4, 18, 0.011, 1.3, sc.art.far, H + 14);
  houses(sc);
  lighthouse(sc);
  harbourSea(sc);
}

function branch(sc: Scene, x: number, y: number, len: number, ang: number, w: number, color: string): void {
  const { ctx } = sc;
  const nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
  if (w > 1.6) {
    branch(sc, nx, ny, len * 0.72, ang - 0.5 - sc.rnd() * 0.25, w * 0.68, color);
    branch(sc, nx, ny, len * 0.72, ang + 0.5 + sc.rnd() * 0.25, w * 0.68, color);
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(nx, ny, 1.8, 0, Math.PI * 2); ctx.fill();
  }
}

export function coral(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  ctx.fillStyle = vGrad(ctx, y0, FLOOR, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, FLOOR - y0 + 2);
  glow(ctx, 320, y0 + 20, 420, art.glow, 0.28);
  ridge(sc, art.horizon - 6, 34, 0.009, 0.4, art.far, FLOOR, 'rgba(127,230,255,0.25)');
  const hues = ['#7a3470', '#9a4668', '#4a4a90', '#2f6f88'];
  for (let x = x0; x < x1; x += 34 + rnd() * 40) {
    const base = art.horizon + 22 + rnd() * 10;
    ctx.globalAlpha = 0.7;
    branch(sc, x, base, 22 + rnd() * 20, -Math.PI / 2 + (rnd() - 0.5) * 0.4, 4.5, hues[Math.floor(rnd() * hues.length)] as string);
  }
  ctx.globalAlpha = 1;
  ridge(sc, art.horizon + 34, 12, 0.02, 2.2, art.near, FLOOR);
  for (let i = 0; i < 9; i++) {
    const fx = x0 + rnd() * (x1 - x0), fy = 100 + rnd() * 140;
    ctx.fillStyle = 'rgba(127,230,255,0.28)';
    ctx.beginPath(); ctx.ellipse(fx, fy, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(fx - 5, fy); ctx.lineTo(fx - 10, fy - 3); ctx.lineTo(fx - 10, fy + 3); ctx.closePath(); ctx.fill();
  }
}

export function kelp(sc: Scene): void {
  const { ctx, x0, x1, y0, art, rnd } = sc;
  ctx.fillStyle = vGrad(ctx, y0, FLOOR, art.sky);
  ctx.fillRect(x0, y0, x1 - x0, FLOOR - y0 + 2);
  glow(ctx, 200, y0 + 10, 360, art.glow, 0.2);
  ridge(sc, art.horizon - 20, 40, 0.008, 2.4, art.far, FLOOR);
  for (let x = x0; x < x1; x += 14 + rnd() * 18) {
    const h = 150 + rnd() * 160;
    ctx.strokeStyle = rnd() < 0.5 ? '#0c5a44' : '#0a4a3a';
    ctx.lineWidth = 3 + rnd() * 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, FLOOR);
    const ph = rnd() * 6;
    for (let k = 1; k <= 8; k++) ctx.lineTo(x + Math.sin(ph + k * 0.7) * 9, FLOOR - (h * k) / 8);
    ctx.stroke();
  }
  ridge(sc, art.horizon + 24, 18, 0.018, 0.9, art.mid, FLOOR, 'rgba(140,240,176,0.22)');
  for (let i = 0; i < 18; i++) {
    const rx = x0 + rnd() * (x1 - x0), ry = art.horizon + 18 + rnd() * 40;
    ctx.fillStyle = 'rgba(11,60,48,0.8)';
    ctx.beginPath(); ctx.ellipse(rx, ry, 14 + rnd() * 18, 6 + rnd() * 5, 0, 0, Math.PI * 2); ctx.fill();
  }
}
