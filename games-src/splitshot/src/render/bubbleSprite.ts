// Glossy translucent bubble sprites, pre-rendered per size at the current view scale.
import { CONFIG } from '../config';
import { BUBBLE_COLORS } from './themes';
import { makeCanvas } from './util';

export interface Sprite { cv: HTMLCanvasElement; /** half-size in world units */ half: number }

const cache = new Map<string, Sprite>();
const PAD = 3;

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function paintBody(ctx: CanvasRenderingContext2D, r: number, size: number): void {
  const c = BUBBLE_COLORS[size] ?? BUBBLE_COLORS[0]!;
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 1.05);
  body.addColorStop(0, hexA(c.light, 0.75));
  body.addColorStop(0.45, hexA(c.body, 0.74));
  body.addColorStop(0.82, hexA(c.body, 0.88));
  body.addColorStop(1, hexA(c.dark, 0.93));
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  const rim = ctx.createRadialGradient(0, 0, r * 0.62, 0, 0, r);
  rim.addColorStop(0, hexA(c.dark, 0));
  rim.addColorStop(1, hexA(c.dark, 0.5));
  ctx.fillStyle = rim;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  const caustic = ctx.createRadialGradient(r * 0.22, r * 0.78, 0, r * 0.22, r * 0.78, r * 0.75);
  caustic.addColorStop(0, hexA(c.light, 0.6));
  caustic.addColorStop(1, hexA(c.light, 0));
  ctx.fillStyle = caustic;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

function paintShine(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.translate(-r * 0.36, -r * 0.42);
  ctx.rotate(-0.7);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.36);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.34, r * 0.17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.62, Math.max(0.7, r * 0.06), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.76, 0.35, 1.15); ctx.stroke();
  if (r > 12) {
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.arc(r * 0.18, r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.42, -r * 0.12, r * 0.06, 0, Math.PI * 2); ctx.stroke();
  }
}

function paintOutline(ctx: CanvasRenderingContext2D, r: number, size: number, assist: boolean): void {
  ctx.strokeStyle = 'rgba(8,12,40,0.8)';
  ctx.lineWidth = Math.max(1.4, r * 0.08);
  ctx.beginPath(); ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(0, 0, r - ctx.lineWidth - Math.max(1.4, r * 0.08), 0, Math.PI * 2); ctx.stroke();
  if (assist) {
    ctx.fillStyle = 'rgba(8,12,40,0.85)';
    ctx.font = `800 ${Math.max(8, r * 0.95)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(size + 1), 0, r * 0.08);
  }
}

/** Sprite for a bubble size at `k` device px per world unit. */
export function bubbleSprite(size: number, k: number, assist: boolean): Sprite {
  const key = `${size}|${k.toFixed(3)}|${assist ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size > 24) cache.clear();
  const r = CONFIG.bubble.radius[size] ?? 8;
  const half = r + PAD;
  const cv = makeCanvas(half * 2 * k, half * 2 * k);
  const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(k, k);
  ctx.translate(half, half);
  paintBody(ctx, r, size);
  paintShine(ctx, r);
  paintOutline(ctx, r, size, assist);
  const sprite = { cv, half };
  cache.set(key, sprite);
  return sprite;
}
