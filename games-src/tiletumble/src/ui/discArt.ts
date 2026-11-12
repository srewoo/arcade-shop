// Baked disc sprites: each (colour, glyph, size) is painted once into an offscreen
// canvas (gem-like dome, bevelled rim, gloss, soft shadow) and blitted every frame.
import { rgba, shade } from './colour';
import { DISC_COLOURS, DISC_SYMBOLS } from './palette';
import { drawSymbol } from './symbols';

export interface Baked {
  readonly canvas: HTMLCanvasElement;
  /** Half-size of the baked canvas in device pixels. */
  readonly half: number;
}

function circle(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
}

function linear(ctx: CanvasRenderingContext2D, r: number, a: [number, string], b: [number, string], c?: [number, string]): CanvasGradient {
  const g = ctx.createLinearGradient(-r * 0.7, -r, r * 0.7, r);
  g.addColorStop(0, a[1]);
  if (c) g.addColorStop(c[0], c[1]);
  g.addColorStop(1, b[1]);
  return g;
}

function paintBody(ctx: CanvasRenderingContext2D, base: string, r: number): void {
  // Soft contact shadow (baked, so shadowBlur costs nothing per frame).
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = r * 0.3;
  ctx.shadowOffsetY = r * 0.1;
  circle(ctx, r);
  ctx.fillStyle = shade(base, -0.55);
  ctx.fill();
  ctx.restore();
  // Bevelled outer rim: lit upper-left, dark lower-right.
  circle(ctx, r);
  ctx.fillStyle = linear(ctx, r, [0, shade(base, 0.55)], [1, shade(base, -0.5)], [0.5, base]);
  ctx.fill();
  // Dome body.
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.38, r * 0.05, 0, 0, r * 0.88);
  body.addColorStop(0, shade(base, 0.5));
  body.addColorStop(0.4, base);
  body.addColorStop(1, shade(base, -0.3));
  circle(ctx, r * 0.87);
  ctx.fillStyle = body;
  ctx.fill();
}

function paintFacet(ctx: CanvasRenderingContext2D, base: string, r: number): void {
  // Inset facet: darker at the top, light pooling at the bottom, like a pressed gem.
  const g = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
  g.addColorStop(0, shade(base, -0.2));
  g.addColorStop(1, shade(base, 0.18));
  circle(ctx, r * 0.6);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.strokeStyle = rgba('#000000', 0.22);
  ctx.stroke();
  // Rim light along the lower edge of the facet.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.6, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = rgba('#ffffff', 0.3);
  ctx.stroke();
}

function paintGloss(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  circle(ctx, r * 0.87);
  ctx.clip();
  const g = ctx.createLinearGradient(0, -r * 0.9, 0, -r * 0.1);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-r * 0.05, -r * 0.5, r * 0.62, r * 0.34, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(-r * 0.46, -r * 0.5, r * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
}

/** Paint one disc into a fresh canvas. `r` is the disc radius in device pixels. */
export function bakeDisc(colour: number, assist: boolean, r: number): Baked {
  const half = Math.ceil(r * 1.35);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = half * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, half };
  const base = DISC_COLOURS[colour] ?? '#ffffff';
  ctx.translate(half, half);
  paintBody(ctx, base, r);
  paintFacet(ctx, base, r);
  paintGloss(ctx, r);
  if (assist) drawSymbol(ctx, DISC_SYMBOLS[colour] ?? 'ring', r * 0.95);
  return { canvas, half };
}

const cache = new Map<string, Baked>();
let scale = 1;

/** Device-pixel ratio of the destination; a change drops every baked sprite. */
export function setRenderScale(dpr: number): void {
  if (dpr !== scale) cache.clear();
  scale = dpr;
}

export function getDisc(colour: number, assist: boolean, radius: number): Baked {
  const r = Math.max(4, Math.round(radius * scale));
  const key = `${colour}|${assist ? 1 : 0}|${r}`;
  let b = cache.get(key);
  if (!b) {
    if (cache.size > 40) cache.clear();
    b = bakeDisc(colour, assist, r);
    cache.set(key, b);
  }
  return b;
}
export const renderScale = (): number => scale;
