// Pure layout maths: which logical field fits a screen, and where it sits inside the canvas.
import { CONFIG } from './config';

export interface Box { w: number; h: number }
export interface Placement { scale: number; offX: number; offY: number }

const F = CONFIG.field;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const BRICK_W = F.cols * F.brickW;

/** Shortest field that still leaves room above the paddle for a board with `rows` rows. */
export const minHeightFor = (rows: number): number =>
  Math.max(F.minH, F.top + Math.max(0, rows) * F.brickH + F.clearance);

/**
 * Pick the logical field for a screen. Tall screens get a taller field (more room under the bricks),
 * wide screens get a wider one (bricks stay centred). The brick grid is always 600 wide.
 */
export function fitField(box: Box, rows: number): { w: number; h: number } {
  const aspect = Math.max(0.1, box.w) / Math.max(0.1, box.h);
  const minH = minHeightFor(rows);
  let w = BRICK_W;
  let h = clamp(w / aspect, minH, F.maxH);
  if (w / aspect < minH) {
    h = minH;
    w = clamp(Math.round(minH * aspect), BRICK_W, F.maxW);
  }
  return { w: Math.round(w), h: Math.round(h) };
}

/** Largest scale that fits the field into the box, centred. */
export function placeField(box: Box, field: { w: number; h: number }): Placement {
  const scale = Math.max(0.01, Math.min(box.w / field.w, box.h / field.h));
  return { scale, offX: (box.w - field.w * scale) / 2, offY: (box.h - field.h * scale) / 2 };
}

/** Share of the box that the field covers (the "play area" measure). */
export function coverage(box: Box, field: { w: number; h: number }): number {
  const p = placeField(box, field);
  return (field.w * p.scale * field.h * p.scale) / Math.max(1, box.w * box.h);
}
