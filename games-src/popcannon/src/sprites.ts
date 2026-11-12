// Pre-rendered bubble sprites and background layer, rebuilt when the canvas scale changes.
// Drawing a cached bitmap avoids creating gradients for every bubble every frame.
import { drawBubble as paint } from './drawBubble';
import { Bubble, H, R, W } from './hex';
import { paintBackground } from './renderBackdrop';

const PAD = 3;
let scaleKey = 0;
const cache = new Map<string, HTMLCanvasElement>();
let background: HTMLCanvasElement | null = null;

function surface(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function checkScale(scale: number): void {
  if (scale === scaleKey) return;
  scaleKey = scale;
  cache.clear();
  background = null;
}

function sprite(b: Bubble, symbols: boolean, scale: number): HTMLCanvasElement {
  checkScale(scale);
  const key = `${b.kind}${b.color}${symbols ? 's' : ''}`;
  let s = cache.get(key);
  if (!s) {
    s = surface((R + PAD) * 2 * scale, (R + PAD) * 2 * scale);
    const c = s.getContext('2d') as CanvasRenderingContext2D;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    paint(c, b, R + PAD, R + PAD, R, symbols);
    cache.set(key, s);
  }
  return s;
}

/** Draw a bubble of radius `r` centred at (x, y) from the sprite cache. */
export function drawSprite(
  ctx: CanvasRenderingContext2D, b: Bubble, x: number, y: number, r: number, symbols: boolean, scale: number,
): void {
  const half = (R + PAD) * (r / R);
  ctx.drawImage(sprite(b, symbols, scale), x - half, y - half, half * 2, half * 2);
}

/** Draw the cached playfield background. */
export function drawBackground(ctx: CanvasRenderingContext2D, scale: number): void {
  checkScale(scale);
  if (!background) {
    background = surface(W * scale, H * scale);
    const c = background.getContext('2d') as CanvasRenderingContext2D;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    paintBackground(c);
  }
  ctx.drawImage(background, 0, 0, W, H);
}
