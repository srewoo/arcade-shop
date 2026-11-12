// Pre-rendered static art: asphalt+verge strip, grass tile, tree variants and glow sprites.
// Everything is drawn once into offscreen canvases (hash-seeded, so identical every run).
import { CONFIG } from './config';
import { ROAD_W } from './viewport';

export const VERGE = 44;
export const ROAD_TILE_W = ROAD_W + VERGE * 2;
export const TILE_H = 320;
export const GRASS_TILE_W = 256;
const RES = 2.5;

export const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function canvasOf(w: number, h: number, res = RES): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * res);
  c.height = Math.ceil(h * res);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(res, res);
  return { c, g };
}

/** Draws fn at the tile and its wrapped copies so blobs that cross an edge stay seamless. */
function wrapped(w: number, h: number, x: number, y: number, r: number, fn: (x: number, y: number) => void): void {
  for (const dx of [-w, 0, w]) {
    for (const dy of [-h, 0, h]) {
      const px = x + dx;
      const py = y + dy;
      if (px > -r && px < w + r && py > -r && py < h + r) fn(px, py);
    }
  }
}

let roadTile: HTMLCanvasElement | null = null;
let grassTile: HTMLCanvasElement | null = null;

function paintLaneWear(g: CanvasRenderingContext2D, x0: number): void {
  for (let l = 0; l < CONFIG.lanes; l++) {
    const cx = x0 + (l + 0.5) * CONFIG.view.laneW;
    for (const dx of [-11, 11]) {
      const grad = g.createLinearGradient(cx + dx - 7, 0, cx + dx + 7, 0);
      grad.addColorStop(0, 'rgba(6,8,12,0)');
      grad.addColorStop(0.5, 'rgba(6,8,12,0.3)');
      grad.addColorStop(1, 'rgba(6,8,12,0)');
      g.fillStyle = grad;
      g.fillRect(cx + dx - 7, 0, 14, TILE_H);
    }
  }
}

function paintAsphalt(g: CanvasRenderingContext2D): void {
  const x0 = VERGE;
  const base = g.createLinearGradient(x0, 0, x0 + ROAD_W, 0);
  base.addColorStop(0, '#2a3038');
  base.addColorStop(0.5, '#343a43');
  base.addColorStop(1, '#2a3038');
  g.fillStyle = base;
  g.fillRect(x0, 0, ROAD_W, TILE_H);
  // Mottled patches (resurfaced sections) and grain.
  for (let i = 0; i < 26; i++) {
    const x = x0 + hash(i + 3) * ROAD_W;
    const y = hash(i + 80) * TILE_H;
    const r = 14 + hash(i + 40) * 34;
    const lite = hash(i + 9) > 0.5;
    wrapped(ROAD_TILE_W, TILE_H, x, y, r, (px, py) => {
      const rg = g.createRadialGradient(px, py, 0, px, py, r);
      rg.addColorStop(0, lite ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  paintLaneWear(g, x0);
  for (let i = 0; i < 520; i++) {
    const x = x0 + hash(i * 3 + 1) * ROAD_W;
    const y = hash(i * 3 + 2) * TILE_H;
    g.fillStyle = hash(i + 700) > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.10)';
    g.fillRect(x, y, 0.8 + hash(i + 900) * 1.4, 0.8 + hash(i + 400) * 1.2);
  }
  // Hairline cracks and tar seams (wrap vertically).
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    let x = x0 + 12 + hash(i + 55) * (ROAD_W - 24);
    let y = hash(i + 66) * TILE_H;
    g.strokeStyle = 'rgba(0,0,0,0.38)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (hash(i * 9 + k) - 0.5) * 9; y += 6 + hash(i * 5 + k) * 10; g.lineTo(x, y); }
    g.stroke();
  }
  // Oil stains.
  for (let i = 0; i < 4; i++) {
    const x = x0 + hash(i + 120) * ROAD_W;
    const y = hash(i + 130) * TILE_H;
    const rg = g.createRadialGradient(x, y, 1, x, y, 16);
    rg.addColorStop(0, 'rgba(4,6,10,0.34)');
    rg.addColorStop(1, 'rgba(4,6,10,0)');
    g.fillStyle = rg;
    wrapped(ROAD_TILE_W, TILE_H, x, y, 16, (px, py) => g.fillRect(px - 16, py - 16, 32, 32));
  }
}

function paintVerge(g: CanvasRenderingContext2D): void {
  for (const left of [true, false]) {
    const x = left ? 0 : VERGE + ROAD_W;
    const grad = g.createLinearGradient(x, 0, x + VERGE, 0);
    grad.addColorStop(left ? 0 : 1, 'rgba(70,58,40,0)');
    grad.addColorStop(left ? 1 : 0, '#5a4e3c');
    g.fillStyle = grad;
    g.fillRect(x, 0, VERGE, TILE_H);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = hash(i + 10) > 0.5 ? 'rgba(220,200,160,0.16)' : 'rgba(20,14,8,0.22)';
      const gx = x + (left ? VERGE - 1 - hash(i + 20) * (VERGE * 0.7) : hash(i + 20) * VERGE * 0.7);
      g.fillRect(gx, hash(i + 30) * TILE_H, 1.2, 1.2);
    }
    // Dark kerb shadow where the gravel meets the tarmac.
    const sh = g.createLinearGradient(left ? VERGE - 6 : VERGE + ROAD_W, 0, left ? VERGE : VERGE + ROAD_W + 6, 0);
    sh.addColorStop(left ? 0 : 1, 'rgba(0,0,0,0)');
    sh.addColorStop(left ? 1 : 0, 'rgba(0,0,0,0.35)');
    g.fillStyle = sh;
    g.fillRect(left ? VERGE - 6 : VERGE + ROAD_W, 0, 6, TILE_H);
  }
}

/** Asphalt with a gravel verge on each side; scrolls vertically (TILE_H period). */
export function getRoadTile(): HTMLCanvasElement {
  if (roadTile) return roadTile;
  const { c, g } = canvasOf(ROAD_TILE_W, TILE_H);
  paintVerge(g);
  paintAsphalt(g);
  roadTile = c;
  return c;
}

/** Mown grass: broad light/dark stripes (period TILE_H) with blades, clover patches and soft blotches. */
export function getGrassTile(): HTMLCanvasElement {
  if (grassTile) return grassTile;
  const { c, g } = canvasOf(GRASS_TILE_W, TILE_H);
  g.fillStyle = '#216b42';
  g.fillRect(0, 0, GRASS_TILE_W, TILE_H);
  const band = g.createLinearGradient(0, 0, 0, TILE_H);
  band.addColorStop(0, 'rgba(0,0,0,0.10)');
  band.addColorStop(0.45, 'rgba(0,0,0,0.10)');
  band.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  band.addColorStop(0.95, 'rgba(255,255,255,0.05)');
  band.addColorStop(1, 'rgba(0,0,0,0.10)');
  g.fillStyle = band;
  g.fillRect(0, 0, GRASS_TILE_W, TILE_H);
  for (let i = 0; i < 18; i++) {
    const x = hash(i + 200) * GRASS_TILE_W;
    const y = hash(i + 240) * TILE_H;
    const r = 20 + hash(i + 280) * 40;
    const lite = hash(i + 7) > 0.5;
    wrapped(GRASS_TILE_W, TILE_H, x, y, r, (px, py) => {
      const rg = g.createRadialGradient(px, py, 0, px, py, r);
      rg.addColorStop(0, lite ? 'rgba(110,190,100,0.10)' : 'rgba(0,20,10,0.12)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  g.lineCap = 'round';
  g.lineWidth = 0.9;
  for (let i = 0; i < 420; i++) {
    const x = hash(i * 2 + 1) * (GRASS_TILE_W - 4) + 2;
    const y = hash(i * 2 + 2) * (TILE_H - 6) + 3;
    g.strokeStyle = hash(i + 55) > 0.5 ? 'rgba(120,210,120,0.22)' : 'rgba(0,25,10,0.28)';
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (hash(i + 3) - 0.5) * 3, y - 2 - hash(i + 4) * 3);
    g.stroke();
  }
  for (let i = 0; i < 22; i++) {
    g.fillStyle = hash(i + 61) > 0.6 ? 'rgba(255,240,150,0.5)' : 'rgba(255,255,255,0.4)';
    g.beginPath();
    g.arc(hash(i + 300) * (GRASS_TILE_W - 4) + 2, hash(i + 340) * (TILE_H - 4) + 2, 0.9, 0, 7);
    g.fill();
  }
  grassTile = c;
  return c;
}

const TREE_R = 24;
const treeCache: HTMLCanvasElement[] = [];

function canopy(g: CanvasRenderingContext2D, seed: number, pine: boolean): void {
  const cx = TREE_R * 1.5;
  const cy = TREE_R * 1.5;
  const sh = g.createRadialGradient(cx + 8, cy + 10, 2, cx + 8, cy + 10, TREE_R * 1.05);
  sh.addColorStop(0, 'rgba(2,8,6,0.5)');
  sh.addColorStop(1, 'rgba(2,8,6,0)');
  g.fillStyle = sh;
  g.fillRect(0, 0, TREE_R * 3, TREE_R * 3);
  const hueShift = hash(seed + 5) * 14 - 7;
  const blobs = pine ? 3 : 7;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + hash(seed + i) * 1.2;
    const d = pine ? 0 : TREE_R * 0.42 * (i === 0 ? 0 : 1);
    const r = pine ? TREE_R * (1 - i * 0.27) : TREE_R * (0.52 + hash(seed + i * 3) * 0.2);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    rg.addColorStop(0, `hsl(${128 + hueShift} 48% ${pine ? 34 : 42}%)`);
    rg.addColorStop(0.65, `hsl(${134 + hueShift} 52% ${pine ? 22 : 29}%)`);
    rg.addColorStop(1, `hsl(${140 + hueShift} 56% ${pine ? 14 : 18}%)`);
    g.fillStyle = rg;
    g.beginPath();
    if (pine) for (let k = 0; k < 16; k++) { const rr = k % 2 ? r * 0.7 : r; g.lineTo(x + Math.cos((k / 16) * 6.283) * rr, y + Math.sin((k / 16) * 6.283) * rr); }
    else g.arc(x, y, r, 0, 7);
    g.closePath();
    g.fill();
  }
  g.fillStyle = 'rgba(200,255,200,0.16)';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(cx - TREE_R * 0.3 + hash(seed + i * 7) * 9, cy - TREE_R * 0.35 + hash(seed + i * 11) * 9, 2 + hash(seed + i) * 3, 0, 7); g.fill(); }
}

/** One of 6 pre-rendered tree variants (4 broadleaf, 2 pine), drawn 3*TREE_R square, centred. */
export function treeSprite(variant: number): HTMLCanvasElement {
  const v = ((variant % 6) + 6) % 6;
  const hit = treeCache[v];
  if (hit) return hit;
  const { c, g } = canvasOf(TREE_R * 3, TREE_R * 3, 3);
  canopy(g, v * 17 + 3, v >= 4);
  treeCache[v] = c;
  return c;
}
export const TREE_SPRITE_R = TREE_R;

let glow: HTMLCanvasElement | null = null;
/** Soft warm light pool, 128 square (used for lamp glow and the pool on the asphalt). */
export function glowSprite(): HTMLCanvasElement {
  if (glow) return glow;
  const { c, g } = canvasOf(128, 128, 1);
  const rg = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,236,176,0.7)');
  rg.addColorStop(0.4, 'rgba(255,226,150,0.22)');
  rg.addColorStop(1, 'rgba(255,220,140,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  glow = c;
  return c;
}
