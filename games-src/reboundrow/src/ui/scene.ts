// Pre-rendered scenery: the full-canvas backdrop and the playfield layer (floor, nebula, grid, rails).
// Both are drawn once into offscreen canvases and re-used until the size changes.
import { CONFIG } from '../config';
import { PALETTE } from '../palette';
import { starfield, type Star } from './stars';

interface Cached { key: string; canvas: HTMLCanvasElement }
let backdropCache: Cached | null = null;
let fieldCache: Cached | null = null;
const liveStars: readonly Star[] = starfield(70, 7);
const fieldStars: readonly Star[] = starfield(90, 21);

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number): void {
  const rg = g.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, `rgba(${rgb},${a})`);
  rg.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = rg;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function paintBackdrop(g: CanvasRenderingContext2D, pw: number, ph: number): void {
  const bg = g.createLinearGradient(0, 0, 0, ph);
  bg.addColorStop(0, '#1d1850');
  bg.addColorStop(0.55, '#0c1230');
  bg.addColorStop(1, '#050816');
  g.fillStyle = bg;
  g.fillRect(0, 0, pw, ph);
  const m = Math.max(pw, ph);
  blob(g, pw * 0.5, ph * 0.05, m * 0.7, '138,108,240', 0.38);
  blob(g, pw * 0.1, ph * 0.75, m * 0.45, '62,193,242', 0.14);
  blob(g, pw * 0.92, ph * 0.55, m * 0.4, '255,107,139', 0.12);
  // Far horizon of tiny bricks silhouettes along the bottom, for depth outside the field.
  g.fillStyle = 'rgba(138,156,255,0.06)';
  const bw = Math.max(24, pw / 18);
  for (let x = 0; x < pw; x += bw) g.fillRect(x + 2, ph - bw * 0.35 * (1 + ((x / bw) % 3)), bw - 4, bw * 0.35 * 3);
}

/** Full-canvas backdrop (device px). Parallax stars drift slowly unless Reduce motion is on. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, pw: number, ph: number, time = 0, reduced = true): void {
  const key = `${pw}x${ph}`;
  if (!backdropCache || backdropCache.key !== key) {
    const [canvas, g] = makeCanvas(pw, ph);
    paintBackdrop(g, canvas.width, canvas.height);
    backdropCache = { key, canvas };
  }
  ctx.drawImage(backdropCache.canvas, 0, 0);
  const k = Math.max(1, pw / 900);
  for (const s of liveStars) {
    const drift = reduced ? 0 : time * 6 * s.depth;
    const x = (((s.x * pw - drift) % pw) + pw) % pw;
    const tw = reduced ? 0.7 : 0.55 + 0.45 * Math.sin(time * (0.8 + s.depth * 2) + s.phase);
    ctx.globalAlpha = tw * (0.25 + s.depth * 0.5);
    ctx.fillStyle = '#dfe6ff';
    const sz = (0.8 + s.depth * 1.6) * k;
    ctx.fillRect(x, s.y * ph, sz, sz);
  }
  ctx.globalAlpha = 1;
}

function paintRails(g: CanvasRenderingContext2D, fw: number, fh: number): void {
  const rail = 9;
  const metal = g.createLinearGradient(0, 0, rail, 0);
  metal.addColorStop(0, '#2a3470');
  metal.addColorStop(0.45, '#8a9cff');
  metal.addColorStop(1, '#3a4690');
  g.fillStyle = metal;
  g.fillRect(0, 0, rail, fh);
  const metalR = g.createLinearGradient(fw - rail, 0, fw, 0);
  metalR.addColorStop(0, '#3a4690');
  metalR.addColorStop(0.55, '#8a9cff');
  metalR.addColorStop(1, '#2a3470');
  g.fillStyle = metalR;
  g.fillRect(fw - rail, 0, rail, fh);
  const top = g.createLinearGradient(0, 0, 0, rail);
  top.addColorStop(0, '#9aa8ee');
  top.addColorStop(1, '#2a3470');
  g.fillStyle = top;
  g.fillRect(0, 0, fw, rail);
  // Rivets and inner glow line (the ball bounces on the glow edge: it reads as the wall).
  g.fillStyle = 'rgba(255,255,255,0.55)';
  for (let y = 40; y < fh; y += 60) {
    g.fillRect(2.5, y, 3, 3);
    g.fillRect(fw - 5.5, y, 3, 3);
  }
  g.strokeStyle = PALETTE.edge;
  g.lineWidth = 2;
  g.strokeRect(rail, rail, fw - rail * 2, fh - rail);
  const glow = g.createLinearGradient(rail, 0, rail + 40, 0);
  glow.addColorStop(0, 'rgba(138,108,240,0.35)');
  glow.addColorStop(1, 'rgba(138,108,240,0)');
  g.fillStyle = glow;
  g.fillRect(rail, rail, 40, fh);
  const glowR = g.createLinearGradient(fw - rail, 0, fw - rail - 40, 0);
  glowR.addColorStop(0, 'rgba(138,108,240,0.35)');
  glowR.addColorStop(1, 'rgba(138,108,240,0)');
  g.fillStyle = glowR;
  g.fillRect(fw - rail - 40, rail, 40, fh);
}

function paintField(g: CanvasRenderingContext2D, fw: number, fh: number, ox: number): void {
  const fl = g.createLinearGradient(0, 0, 0, fh);
  fl.addColorStop(0, PALETTE.fieldTop);
  fl.addColorStop(1, PALETTE.field);
  g.fillStyle = fl;
  g.fillRect(0, 0, fw, fh);
  blob(g, fw * 0.3, fh * 0.25, fw * 0.6, '98,80,200', 0.22);
  blob(g, fw * 0.8, fh * 0.6, fw * 0.55, '40,150,210', 0.12);
  for (const s of fieldStars) {
    g.fillStyle = `rgba(200,215,255,${0.12 + s.depth * 0.3})`;
    g.fillRect(s.x * fw, s.y * fh, 1 + s.depth, 1 + s.depth);
  }
  // Floor grid converging slightly toward the top for a hint of perspective.
  g.strokeStyle = 'rgba(100,120,200,0.16)';
  g.lineWidth = 1;
  g.beginPath();
  for (let x = ox + CONFIG.field.brickW; x < fw; x += CONFIG.field.brickW) {
    g.moveTo(x, CONFIG.field.top);
    g.lineTo(x, fh);
  }
  for (let y = fh - 30; y > CONFIG.field.top; y -= 46) {
    g.moveTo(10, y);
    g.lineTo(fw - 10, y);
  }
  g.stroke();
  // Paddle lane glow.
  const lane = g.createLinearGradient(0, fh - 120, 0, fh);
  lane.addColorStop(0, 'rgba(138,108,240,0)');
  lane.addColorStop(1, 'rgba(138,108,240,0.22)');
  g.fillStyle = lane;
  g.fillRect(0, fh - 120, fw, 120);
  paintRails(g, fw, fh);
  const vig = g.createRadialGradient(fw / 2, fh / 2, Math.min(fw, fh) * 0.5, fw / 2, fh / 2, Math.max(fw, fh) * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(3,5,16,0.26)');
  g.fillStyle = vig;
  g.fillRect(0, 0, fw, fh);
}

/** Draw the cached playfield layer into the current (field-space) transform. */
export function drawFieldLayer(ctx: CanvasRenderingContext2D, fw: number, fh: number, ox: number): void {
  const s = Math.max(1, Math.min(2, Math.round(ctx.getTransform().a * 2) / 2));
  const key = `${fw}x${fh}|${ox}|${s}`;
  if (!fieldCache || fieldCache.key !== key) {
    const [canvas, g] = makeCanvas(fw * s, fh * s);
    g.scale(s, s);
    paintField(g, fw, fh, ox);
    fieldCache = { key, canvas };
  }
  ctx.drawImage(fieldCache.canvas, 0, 0, fw, fh);
}
