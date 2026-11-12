// Backdrop decoration: god-ray shafts and glowing crystal clusters on the ridge layers.
import { LAYERS, hash2, ridgeY } from './caveMath';
import type { Palette, View } from './view';

type Ctx = CanvasRenderingContext2D;

let shaftCv: HTMLCanvasElement | null = null;
let shaftH = 0;

/** One soft light wedge (white, additive), cached per view height. */
function shaftSprite(h: number): HTMLCanvasElement {
  if (shaftCv && shaftH === Math.round(h)) return shaftCv;
  const w = 260;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = Math.round(h);
  const c = cv.getContext('2d');
  if (c) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(150,215,255,0.09)');
    g.addColorStop(0.6, 'rgba(120,200,255,0.03)');
    g.addColorStop(1, 'rgba(120,200,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(w * 0.3, 0);
    c.lineTo(w * 0.42, 0);
    c.lineTo(w * 0.95, h);
    c.lineTo(w * 0.05, h);
    c.fill();
  }
  shaftCv = cv;
  shaftH = Math.round(h);
  return cv;
}

export function drawShafts(ctx: Ctx, v: View, camX: number, time: number, shimmer: boolean): void {
  const h = v.bottom - v.top;
  const sp = shaftSprite(h);
  ctx.save();
  const k = 0.1;
  const cell = 340;
  const first = Math.floor((camX * k) / cell) - 1;
  for (let c = first; c <= first + Math.ceil(v.wv / cell) + 2; c++) {
    if (hash2(c, 41) < 0.5) continue;
    const x = c * cell + hash2(c, 42) * cell - camX * k;
    ctx.globalAlpha = shimmer ? 0.75 + 0.25 * Math.sin(time * 0.6 + c) : 1;
    ctx.drawImage(sp, x - 70, v.top, 140 + hash2(c, 43) * 80, h);
  }
  ctx.restore();
}

function crystal(ctx: Ctx, x: number, y: number, s: number, tint: string, glowAmt: number): void {
  const halo = ctx.createRadialGradient(x, y - s * 0.6, 0, x, y - s * 0.6, s * 2.6);
  halo.addColorStop(0, tint);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.28 * glowAmt;
  ctx.fillStyle = halo;
  ctx.fillRect(x - s * 2.6, y - s * 3.2, s * 5.2, s * 4);
  ctx.restore();
  const spikes = [[-0.5, 0.7, 0.18], [0, 1, 0.22], [0.5, 0.6, 0.17]] as const;
  for (const [dx, h, w] of spikes) {
    const g = ctx.createLinearGradient(x + dx * s, y, x + dx * s, y - h * s * 1.6);
    g.addColorStop(0, 'rgba(10,30,50,0.9)');
    g.addColorStop(1, tint);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + (dx - w) * s, y + 2);
    ctx.lineTo(x + (dx - w * 0.6) * s, y - h * s * 1.2);
    ctx.lineTo(x + dx * s, y - h * s * 1.6);
    ctx.lineTo(x + (dx + w * 0.6) * s, y - h * s * 1.2);
    ctx.lineTo(x + (dx + w) * s, y + 2);
    ctx.closePath();
    ctx.fill();
  }
}

/** Crystal clusters sitting on ridge layer `i` (parallax-correct). */
export function drawCrystals(ctx: Ctx, v: View, p: Palette, camX: number, i: number, time: number, shimmer: boolean): void {
  const L = LAYERS[i] as (typeof LAYERS)[number];
  const cell = 110;
  const first = Math.floor((camX * L.k) / cell) - 1;
  ctx.globalAlpha = L.alpha;
  for (let c = first; c <= first + Math.ceil(v.wv * L.k / cell) + 3; c++) {
    if (hash2(c, 50 + i) < 0.5) continue;
    const u = c * cell + hash2(c, 52) * cell;
    const sx = u / L.k - camX;
    const pulse = shimmer ? 0.7 + 0.3 * Math.sin(time * 1.4 + c * 1.9) : 1;
    const tint = hash2(c, 53) < 0.3 ? 'rgba(190,130,255,0.9)' : p.glow;
    crystal(ctx, sx, ridgeY(i, u), 14 + hash2(c, 54) * 14 + i * 4, tint, pulse);
  }
  ctx.globalAlpha = 1;
}
