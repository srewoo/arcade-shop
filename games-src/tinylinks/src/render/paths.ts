import type { Shape, Vec } from '../physics/types';

export function polyPath(ctx: CanvasRenderingContext2D, polys: readonly (readonly Vec[])[]): void {
  ctx.beginPath();
  for (const poly of polys) {
    poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
  }
}

/** Trace a hazard shape, optionally grown (+) or shrunk (-) by `inset` units. */
export function shapePath(ctx: CanvasRenderingContext2D, s: Shape, grow = 0): void {
  ctx.beginPath();
  if (s.t === 'r') {
    const r = Math.min(10, Math.min(s.w, s.h) / 4);
    ctx.roundRect(s.x - grow, s.y - grow, s.w + grow * 2, s.h + grow * 2, r);
  } else {
    ctx.ellipse(s.x, s.y, Math.max(1, s.rx + grow), Math.max(1, s.ry + grow), 0, 0, Math.PI * 2);
  }
}

export const shapeCenter = (s: Shape): Vec => (s.t === 'r' ? { x: s.x + s.w / 2, y: s.y + s.h / 2 } : { x: s.x, y: s.y });
export const shapeBox = (s: Shape): { x: number; y: number; w: number; h: number } =>
  (s.t === 'r' ? { x: s.x, y: s.y, w: s.w, h: s.h } : { x: s.x - s.rx, y: s.y - s.ry, w: s.rx * 2, h: s.ry * 2 });
