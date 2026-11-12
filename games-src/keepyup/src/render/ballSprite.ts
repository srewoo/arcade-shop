// Tennis ball art. The fuzzy body + seam is baked once per pixel size and rotated for spin;
// the lighting overlay is separate so highlights stay put while the ball turns.
import { CONFIG } from '../config';
import { mulberry32 } from '../rng';
import { makeCanvas } from './layout';
import { PAL } from './palette';

interface Baked { body: HTMLCanvasElement; light: HTMLCanvasElement; pxR: number }
let cache: Baked | null = null;
const PAD = 5;

function bakeBody(pxR: number): HTMLCanvasElement {
  const size = Math.ceil((pxR + PAD) * 2);
  const c = makeCanvas(size, size);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.translate(size / 2, size / 2);
  const base = g.createRadialGradient(-pxR * 0.3, -pxR * 0.35, pxR * 0.1, 0, 0, pxR);
  base.addColorStop(0, PAL.ballLight); base.addColorStop(0.45, PAL.ball); base.addColorStop(1, PAL.ballDark);
  const rnd = mulberry32(4242);
  // Felt fibres standing off the edge give the fuzzy silhouette.
  g.strokeStyle = PAL.ball; g.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2; const len = 1 + rnd() * PAD * 0.8;
    g.globalAlpha = 0.35 + rnd() * 0.4; g.lineWidth = Math.max(0.8, pxR * 0.035);
    g.beginPath(); g.moveTo(Math.cos(a) * (pxR - 1), Math.sin(a) * (pxR - 1)); g.lineTo(Math.cos(a) * (pxR + len), Math.sin(a) * (pxR + len)); g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = base; g.beginPath(); g.arc(0, 0, pxR, 0, Math.PI * 2); g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 380; i++) { // felt speckle
    const a = rnd() * Math.PI * 2; const d = Math.sqrt(rnd()) * pxR;
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,220,0.35)' : 'rgba(80,100,0,0.28)';
    g.fillRect(Math.cos(a) * d, Math.sin(a) * d, Math.max(1, pxR * 0.045), Math.max(1, pxR * 0.03));
  }
  seam(g, pxR);
  g.restore();
  return c;
}

function seam(g: CanvasRenderingContext2D, r: number): void {
  const arc = (cx: number, cy: number, dy: number, color: string, w: number): void => {
    g.strokeStyle = color; g.lineWidth = w;
    g.beginPath(); g.arc(cx, cy + dy, r * 0.98, 0, Math.PI * 2); g.stroke();
  };
  for (const [cx, cy] of [[-1.28 * r, -0.5 * r], [1.28 * r, 0.5 * r]] as const) {
    arc(cx, cy, r * 0.05, PAL.seamShade, r * 0.14);
    arc(cx, cy, 0, PAL.seam, r * 0.1);
  }
}

function bakeLight(pxR: number): HTMLCanvasElement {
  const size = Math.ceil((pxR + PAD) * 2);
  const c = makeCanvas(size, size);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.translate(size / 2, size / 2);
  const shade = g.createRadialGradient(-pxR * 0.35, -pxR * 0.4, pxR * 0.2, 0, 0, pxR * 1.05);
  shade.addColorStop(0, 'rgba(255,255,255,0.28)'); shade.addColorStop(0.5, 'rgba(255,255,255,0)'); shade.addColorStop(1, 'rgba(20,40,0,0.5)');
  g.fillStyle = shade; g.beginPath(); g.arc(0, 0, pxR, 0, Math.PI * 2); g.fill();
  g.strokeStyle = PAL.ballRim; g.lineWidth = Math.max(2, pxR * 0.08);
  g.beginPath(); g.arc(0, 0, pxR - g.lineWidth / 2 + 0.5, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = Math.max(1, pxR * 0.05); g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, pxR * 0.72, Math.PI * 1.15, Math.PI * 1.45); g.stroke(); // specular glint
  return c;
}

function baked(pxR: number): Baked {
  const r = Math.round(pxR);
  if (!cache || cache.pxR !== r) cache = { pxR: r, body: bakeBody(r), light: bakeLight(r) };
  return cache;
}

/** Draw one ball centred at world (x,y), rotated by `rot`, squashed by `squash` (1 = round). */
export function drawBall(ctx: CanvasRenderingContext2D, pxScale: number, x: number, y: number, rot: number, squash = 1): void {
  const b = baked(CONFIG.ball.radius * pxScale);
  const half = b.body.width / 2 / pxScale;
  ctx.save();
  ctx.translate(x, y + CONFIG.ball.radius * (1 - squash));
  ctx.scale(1 + (1 - squash) * 0.5, squash);
  ctx.save(); ctx.rotate(rot);
  ctx.drawImage(b.body, -half, -half, half * 2, half * 2);
  ctx.restore();
  ctx.drawImage(b.light, -half, -half, half * 2, half * 2);
  ctx.restore();
}
