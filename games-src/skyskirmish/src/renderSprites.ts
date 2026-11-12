// Pre-rendered background sprites (cloud banks, floating islands, wind streaks). Drawn once to
// offscreen canvases at 2x and blitted every frame, so the parallax sky stays cheap.
import { poly, sprite, type Ctx } from './renderKit';

export const hash = (i: number, salt: number): number => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const SCALE = 2;
export const CLOUD_W = 220;
export const CLOUD_H = 120;
export const ISLAND_W = 200;
export const ISLAND_H = 170;

function puffs(c: Ctx, seed: number): void {
  const list: { x: number; y: number; r: number }[] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const arc = Math.sin(u * Math.PI);
    const r = 16 + hash(i, seed) * 14 + arc * 12;
    list.push({ x: 20 + u * (CLOUD_W - 40), y: CLOUD_H - 30 - arc * 26 - hash(i, seed + 9) * 12, r });
  }
  list.sort((a, b) => a.y - b.y);
  for (const p of list) {
    const g = c.createRadialGradient(p.x - p.r * 0.25, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y, p.r);
    g.addColorStop(0, 'rgba(236,243,255,0.95)');
    g.addColorStop(0.45, 'rgba(160,178,226,0.9)');
    g.addColorStop(1, 'rgba(90,118,180,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    c.fill();
  }
  const flat = c.createLinearGradient(0, CLOUD_H - 38, 0, CLOUD_H - 6);
  flat.addColorStop(0, 'rgba(70,92,150,0)');
  flat.addColorStop(1, 'rgba(52,72,128,0.5)');
  c.fillStyle = flat;
  c.beginPath();
  c.ellipse(CLOUD_W / 2, CLOUD_H - 18, CLOUD_W * 0.42, 15, 0, 0, Math.PI * 2);
  c.fill();
}

function islandBody(c: Ctx, seed: number): void {
  const cx = ISLAND_W / 2;
  const top = 46;
  const g = c.createLinearGradient(0, top, 0, ISLAND_H);
  g.addColorStop(0, '#5a5a74');
  g.addColorStop(0.5, '#34385a');
  g.addColorStop(1, '#161a33');
  poly(c, [[16, top + 4], [ISLAND_W - 16, top + 4], [ISLAND_W - 50, top + 44], [cx + 34, top + 78], [cx + 8, ISLAND_H - 14 - hash(1, seed) * 14], [cx - 20, top + 70], [50, top + 40]], g);
  poly(c, [[cx + 8, top + 20], [ISLAND_W - 28, top + 8], [ISLAND_W - 52, top + 44], [cx + 34, top + 78]], 'rgba(8,10,28,0.38)');
}

function islandTop(c: Ctx, seed: number): void {
  const cx = ISLAND_W / 2;
  const grass = c.createLinearGradient(0, 22, 0, 58);
  grass.addColorStop(0, '#6fe0a0');
  grass.addColorStop(1, '#238c68');
  c.fillStyle = grass;
  c.beginPath();
  c.moveTo(12, 52);
  c.bezierCurveTo(24, 26, 60, 28, cx, 30);
  c.bezierCurveTo(cx + 50, 28, ISLAND_W - 28, 24, ISLAND_W - 12, 52);
  c.bezierCurveTo(ISLAND_W - 40, 62, 50, 62, 12, 52);
  c.fill();
  c.strokeStyle = 'rgba(210,255,225,0.55)';
  c.lineWidth = 1.2;
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const x = 36 + hash(i, seed + 4) * (ISLAND_W - 72);
    const y = 36 + hash(i, seed + 5) * 14;
    const h = 8 + hash(i, seed + 6) * 10;
    poly(c, [[x, y - h], [x + 5, y], [x - 5, y]], '#0f5a45');
    poly(c, [[x, y - h], [x + 2.5, y - h * 0.4], [x - 1, y - h * 0.4]], 'rgba(160,255,200,0.5)');
  }
}

function islandSprite(seed: number): HTMLCanvasElement {
  return sprite(ISLAND_W, ISLAND_H, SCALE, (c) => {
    islandBody(c, seed);
    islandTop(c, seed);
    const haze = c.createLinearGradient(0, 0, 0, ISLAND_H);
    haze.addColorStop(0, 'rgba(60,90,150,0)');
    haze.addColorStop(1, 'rgba(60,90,150,0.35)');
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = haze;
    c.fillRect(0, 0, ISLAND_W, ISLAND_H);
  });
}

export interface BgSprites {
  clouds: HTMLCanvasElement[];
  islands: HTMLCanvasElement[];
}

let cache: BgSprites | null = null;

export function bgSprites(): BgSprites {
  cache ??= {
    clouds: [1, 2, 3, 4, 5].map((s) => sprite(CLOUD_W, CLOUD_H, SCALE, (c) => puffs(c, s * 7))),
    islands: [3, 5, 8].map(islandSprite),
  };
  return cache;
}
