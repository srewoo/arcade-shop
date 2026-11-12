// Parallax sky drawn across the whole canvas (outside the lane too). The static parts (gradient,
// stars, sunset glow, light shafts, vignette) are cached on an offscreen canvas; clouds and
// islands are cached sprites scrolled each frame. `scroll` is 0 with reduced motion: static scene.
import type { Palette } from './palette';
import { hash, bgSprites, CLOUD_H, CLOUD_W, ISLAND_H, ISLAND_W } from './renderSprites';
import type { Geom } from './view';

type Ctx = CanvasRenderingContext2D;

const CLOUDS = Array.from({ length: 30 }, (_, i) => ({ nx: hash(i, 1), ny: hash(i, 2), size: 0.6 + hash(i, 3) * 0.8, layer: i % 3, v: i % 5 }));
const STARS = Array.from({ length: 70 }, (_, i) => ({ nx: hash(i, 4), ny: hash(i, 5) * 0.55, r: 0.5 + hash(i, 6) * 1.2 }));
const ISLANDS = Array.from({ length: 4 }, (_, i) => ({ nx: 0.1 + i * 0.27 + hash(i, 7) * 0.1, ny: hash(i, 8), size: 0.7 + hash(i, 9) * 0.6, v: i % 3 }));
const LAYER_SPEED = [10, 24, 46] as const;
const LAYER_ALPHA = [0.3, 0.4, 0.5] as const;
const LAYER_SIZE = [100, 140, 190] as const;
const STREAKS = Array.from({ length: 14 }, (_, i) => ({ nx: hash(i, 11), ny: hash(i, 12), len: 40 + hash(i, 13) * 70 }));

let baseKey = '';
let baseCanvas: HTMLCanvasElement | null = null;

function paintStatic(c: Ctx, p: Palette, w: number, h: number): void {
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, p.skyTop);
  grad.addColorStop(0.55, p.skyBottom);
  grad.addColorStop(1, '#2d4f86');
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
  for (const s of STARS) {
    c.globalAlpha = 0.35 + 0.5 * (1 - s.ny);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(s.nx * w, s.ny * h, s.r, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  const sx = w * 0.72;
  const sy = h * 1.02;
  const sun = c.createRadialGradient(sx, sy, 0, sx, sy, h * 0.62);
  sun.addColorStop(0, 'rgba(255,214,150,0.65)');
  sun.addColorStop(0.25, p.horizon);
  sun.addColorStop(1, 'rgba(255,120,80,0)');
  c.fillStyle = sun;
  c.fillRect(0, 0, w, h);
  shafts(c, h, sx, sy);
  const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
  vg.addColorStop(0, 'rgba(2,8,24,0)');
  vg.addColorStop(1, 'rgba(2,8,24,0.55)');
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
}

/** Soft god-rays fanning up from the low sun. */
function shafts(c: Ctx, h: number, sx: number, sy: number): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.2 + (hash(i, 21) - 0.5) * 0.08;
    const half = 0.035 + hash(i, 22) * 0.03;
    const len = h * 1.3;
    const g = c.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    g.addColorStop(0, 'rgba(255,200,150,0.08)');
    g.addColorStop(1, 'rgba(255,200,150,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + Math.cos(a - half) * len, sy + Math.sin(a - half) * len);
    c.lineTo(sx + Math.cos(a + half) * len, sy + Math.sin(a + half) * len);
    c.fill();
  }
  c.restore();
}

function base(c: Ctx, p: Palette, g: Geom): void {
  const key = `${g.cssW}x${g.cssH}@${g.dpr}|${p.skyTop}|${p.horizon}`;
  if (key !== baseKey || !baseCanvas) {
    baseCanvas = document.createElement('canvas');
    baseCanvas.width = Math.round(g.cssW * g.dpr);
    baseCanvas.height = Math.round(g.cssH * g.dpr);
    const bc = baseCanvas.getContext('2d');
    if (bc) {
      bc.scale(g.dpr, g.dpr);
      paintStatic(bc, p, g.cssW, g.cssH);
    }
    baseKey = key;
  }
  c.drawImage(baseCanvas, 0, 0, g.cssW, g.cssH);
}

function twinkle(c: Ctx, g: Geom, t: number): void {
  c.fillStyle = '#fff';
  for (let i = 0; i < 9; i++) {
    const s = STARS[i * 7 % STARS.length];
    if (!s) continue;
    c.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.3 + i * 1.7));
    const x = s.nx * g.cssW;
    const y = s.ny * g.cssH;
    c.fillRect(x - 3, y - 0.4, 6, 0.8);
    c.fillRect(x - 0.4, y - 3, 0.8, 6);
  }
  c.globalAlpha = 1;
}

function islands(c: Ctx, g: Geom, scroll: number): void {
  const sp = bgSprites().islands;
  const k = g.layout.scale;
  const span = g.cssH + 320 * k;
  for (const isl of ISLANDS) {
    const y = ((isl.ny * span + scroll * 16 * k) % span) - 190 * k;
    const w = ISLAND_W * isl.size * k * 0.8;
    const h = ISLAND_H * isl.size * k * 0.8;
    const img = sp[isl.v % sp.length];
    if (!img) continue;
    c.globalAlpha = 0.85;
    c.drawImage(img, isl.nx * g.cssW - w / 2, y - h / 2, w, h);
  }
  c.globalAlpha = 1;
}

function clouds(c: Ctx, g: Geom, scroll: number): void {
  const sp = bgSprites().clouds;
  const k = g.layout.scale;
  const span = g.cssH + 260 * k;
  for (let layer = 0; layer < 3; layer++) {
    c.globalAlpha = LAYER_ALPHA[layer] ?? 0.5;
    for (const cl of CLOUDS) {
      if (cl.layer !== layer) continue;
      const w = (LAYER_SIZE[layer] ?? 120) * cl.size * k;
      const h = (w * CLOUD_H) / CLOUD_W;
      const y = ((cl.ny * span + scroll * (LAYER_SPEED[layer] ?? 10) * k) % span) - 130 * k;
      const img = sp[cl.v % sp.length];
      if (img) c.drawImage(img, cl.nx * g.cssW - w / 2, y - h / 2, w, h);
    }
  }
  c.globalAlpha = 1;
}

function streaks(c: Ctx, g: Geom, scroll: number): void {
  if (scroll === 0) return;
  const k = g.layout.scale;
  c.strokeStyle = 'rgba(200,225,255,0.10)';
  c.lineWidth = 1.2;
  c.beginPath();
  for (const s of STREAKS) {
    const span = g.cssH + 200;
    const y = ((s.ny * span + scroll * 420 * k) % span) - 100;
    const x = s.nx * g.cssW;
    c.moveTo(x, y);
    c.lineTo(x, y + s.len * k);
  }
  c.stroke();
}

/** Dim everything outside the lane and mark its edges with soft glowing rails. */
function lane(c: Ctx, g: Geom): void {
  const { x, y, w, h } = g.layout;
  c.fillStyle = 'rgba(3,9,22,0.4)';
  c.fillRect(0, 0, x, g.cssH);
  c.fillRect(x + w, 0, g.cssW - x - w, g.cssH);
  c.fillRect(x, 0, w, y);
  c.fillRect(x, y + h, w, g.cssH - y - h);
  for (const edge of [x, x + w]) {
    const rail = c.createLinearGradient(0, y, 0, y + h);
    rail.addColorStop(0, 'rgba(120,210,255,0.05)');
    rail.addColorStop(0.5, 'rgba(120,210,255,0.55)');
    rail.addColorStop(1, 'rgba(120,210,255,0.05)');
    const halo = c.createLinearGradient(edge - 10, 0, edge + 10, 0);
    halo.addColorStop(0, 'rgba(120,210,255,0)');
    halo.addColorStop(0.5, 'rgba(120,210,255,0.10)');
    halo.addColorStop(1, 'rgba(120,210,255,0)');
    c.fillStyle = halo;
    c.fillRect(edge - 10, y, 20, h);
    c.lineWidth = 2;
    c.strokeStyle = rail;
    c.beginPath();
    c.moveTo(edge, y);
    c.lineTo(edge, y + h);
    c.stroke();
  }
}

export function drawBackground(c: Ctx, p: Palette, g: Geom, scroll: number): void {
  base(c, p, g);
  if (scroll !== 0) twinkle(c, g, scroll);
  islands(c, g, scroll);
  clouds(c, g, scroll);
  streaks(c, g, scroll);
  lane(c, g);
}
