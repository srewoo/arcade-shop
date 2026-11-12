// Cave backdrop: depth gradient, light shafts, hanging stalactites, three parallax ridge layers
// with glowing crystal clusters, mist and drifting motes. Reduced motion freezes the parallax
// (and the shimmer); the scene is still fully drawn.
import { LAYERS, hash2, ridgeY } from './caveMath';
import { drawCrystals, drawShafts } from './caveDeco';
import type { Palette, View } from './view';

export { hash2 } from './caveMath';

const STEP = 10;
function ridge(ctx: CanvasRenderingContext2D, v: View, p: Palette, camX: number, i: number): void {
  const L = LAYERS[i] as (typeof LAYERS)[number];
  ctx.beginPath();
  ctx.moveTo(-10, v.bottom + 10);
  for (let sx = -10; sx <= v.wv + STEP; sx += STEP) ctx.lineTo(sx, ridgeY(i, (sx + camX) * L.k));
  ctx.lineTo(v.wv + 10, v.bottom + 10);
  ctx.closePath();
  ctx.fillStyle = L.tone === 'far' ? p.caveFar : p.caveMid;
  ctx.fill();
  if (i > 0) {
    ctx.strokeStyle = p.rim;
    ctx.globalAlpha = 0.07 * (i + 1);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** Dark teeth hanging from the far ceiling. */
function stalactites(ctx: CanvasRenderingContext2D, v: View, p: Palette, camX: number, k: number, fill: string, alpha: number): void {
  const cell = 46;
  const first = Math.floor((camX * k) / cell) - 1;
  ctx.fillStyle = fill;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let c = first; c <= first + Math.ceil(v.wv / (cell / k)) + 3; c++) {
    if (hash2(c, 31) < 0.35) continue;
    const sx = (c * cell + hash2(c, 32) * cell) / k - camX;
    const w = (14 + hash2(c, 33) * 18) / k * 0.6;
    const h = 30 + hash2(c, 34) * 90;
    ctx.moveTo(sx - w, v.top - 10);
    ctx.quadraticCurveTo(sx - w * 0.2, v.top + h * 0.5, sx, v.top + h);
    ctx.quadraticCurveTo(sx + w * 0.2, v.top + h * 0.5, sx + w, v.top - 10);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  void p;
}

let staticKey = '';
let staticCv: HTMLCanvasElement | null = null;

/** Gradient depth, central glow, floor mist and ceiling shade: view-fixed, so painted once. */
function staticLayer(ctx: CanvasRenderingContext2D, v: View, p: Palette): HTMLCanvasElement | null {
  const key = `${p.cave}|${p.caveFar}|${v.pxW}|${v.pxH}|${v.dpr}|${v.s}`;
  if (key === staticKey && staticCv) return staticCv;
  const cv = document.createElement('canvas');
  cv.width = Math.round(v.wv * v.s * v.dpr);
  cv.height = Math.round((v.bottom - v.top) * v.s * v.dpr);
  const c = cv.getContext('2d');
  if (!c) return null;
  c.scale(v.s * v.dpr, v.s * v.dpr);
  c.translate(0, -v.top);
  const g = c.createLinearGradient(0, v.top, 0, v.bottom);
  g.addColorStop(0, p.cave);
  g.addColorStop(0.55, p.caveFar);
  g.addColorStop(1, p.cave);
  c.fillStyle = g;
  c.fillRect(0, v.top, v.wv, v.bottom - v.top);
  const mid = c.createRadialGradient(v.wv * 0.5, 225, 20, v.wv * 0.5, 225, v.wv * 0.6);
  mid.addColorStop(0, 'rgba(76,195,255,0.10)');
  mid.addColorStop(1, 'rgba(76,195,255,0)');
  c.fillStyle = mid;
  c.fillRect(0, v.top, v.wv, v.bottom - v.top);
  staticKey = key;
  staticCv = cv;
  void ctx;
  return cv;
}

/** Floor mist and ceiling shade, drawn over the ridges. */
function mist(ctx: CanvasRenderingContext2D, v: View): void {
  const g = ctx.createLinearGradient(0, v.bottom - 160, 0, v.bottom);
  g.addColorStop(0, 'rgba(76,195,255,0)');
  g.addColorStop(1, 'rgba(76,195,255,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(-10, v.bottom - 160, v.wv + 20, 170);
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, v: View, p: Palette, camX: number, parallax: boolean, time = 0): void {
  const base = staticLayer(ctx, v, p);
  if (base) ctx.drawImage(base, 0, v.top, v.wv, v.bottom - v.top);
  const cam = parallax ? camX : 0;
  drawShafts(ctx, v, cam, time, parallax);
  stalactites(ctx, v, p, cam, 0.2, p.caveFar, 0.7);
  stalactites(ctx, v, p, cam, 0.38, p.caveMid, 0.55);
  for (let i = 0; i < LAYERS.length; i++) {
    const L = LAYERS[i] as (typeof LAYERS)[number];
    ctx.globalAlpha = L.alpha;
    ridge(ctx, v, p, cam, i);
    ctx.globalAlpha = 1;
    if (i < 2) drawCrystals(ctx, v, p, cam, i, time, parallax);
  }
  ctx.globalAlpha = 1;
  mist(ctx, v);
  if (parallax) drawMotes(ctx, v, p, camX, time);
}

function drawMotes(ctx: CanvasRenderingContext2D, v: View, p: Palette, camX: number, time: number): void {
  ctx.fillStyle = p.glow;
  const cell = 70;
  const k = 0.6;
  const first = Math.floor((camX * k) / cell);
  for (let c = first; c <= first + Math.ceil(v.wv / cell) + 1; c++) {
    for (let r = 0; r < 6; r++) {
      const x = c * cell + hash2(c, r) * cell - camX * k;
      const y = 40 + r * 70 + hash2(r, c) * 50 + Math.sin(time * 0.8 + c + r) * 6;
      ctx.globalAlpha = 0.1 + 0.22 * hash2(c + 9, r + 3) * (0.5 + 0.5 * Math.sin(time * 1.6 + c * 3 + r));
      ctx.beginPath();
      ctx.arc(x, y, 1 + hash2(c, r + 7) * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
