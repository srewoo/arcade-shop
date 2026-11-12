// Shared geometry helpers for the lane scene: perspective polygons and floor strips.
import { BACK_ROW_Y, HEAD_Y, PIT_Y } from './constants';
import { project, type Camera } from './project';

export type Ctx = CanvasRenderingContext2D;
export type Pt3 = readonly [number, number, number];

export const BACK_Y = PIT_Y + 160;
export const WALL_H = 46;
export const APPROACH = 700;
export const DECK_Y = HEAD_Y - 80;
export const DECK_END = BACK_ROW_Y + 40;

export function poly(ctx: Ctx, cam: Camera, pts: readonly Pt3[], fill: string | CanvasGradient): void {
  ctx.beginPath();
  pts.forEach(([x, y, z], i) => {
    const p = project(cam, x, y, z);
    if (i === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Trace a floor rectangle as a path without filling (for clips). */
export function tracePoly(ctx: Ctx, cam: Camera, pts: readonly Pt3[]): void {
  ctx.beginPath();
  pts.forEach(([x, y, z], i) => {
    const p = project(cam, x, y, z);
    if (i === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  });
  ctx.closePath();
}

/** Flat strip on the floor between two y values, clipped to what the camera can see. */
export function floorStrip(ctx: Ctx, cam: Camera, x0: number, x1: number, y0: number, y1: number, fill: string | CanvasGradient): void {
  const a = Math.max(y0, cam.y - 10);
  if (a >= y1) return;
  poly(ctx, cam, [[x0, a, 0], [x1, a, 0], [x1, y1, 0], [x0, y1, 0]], fill);
}

/** Cheap deterministic hash in 0..1, so planks keep their tone between repaints. */
export const hash01 = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
