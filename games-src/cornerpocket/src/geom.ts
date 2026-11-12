// Small geometry helpers for clipping the cue stick and guide rays to the visible area.
import { LAYOUT } from './config/layout';
import { toTable, type View } from './view';

export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Distance along (dx,dy) from (x,y) until the ray leaves `r` (Infinity if it never does). */
export function rayExit(x: number, y: number, dx: number, dy: number, r: Rect): number {
  let t = Infinity;
  if (dx > 1e-9) t = Math.min(t, (r.x1 - x) / dx); else if (dx < -1e-9) t = Math.min(t, (r.x0 - x) / dx);
  if (dy > 1e-9) t = Math.min(t, (r.y1 - y) / dy); else if (dy < -1e-9) t = Math.min(t, (r.y0 - y) / dy);
  return Math.max(0, t);
}

/** The canvas, expressed as a rectangle in table coordinates. */
export function visibleBounds(v: View, cssW: number, cssH: number): Rect {
  const pts = [toTable(v, 0, 0), toTable(v, cssW, 0), toTable(v, 0, cssH), toTable(v, cssW, cssH)];
  const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** Length of the cue stick behind the ball: never past the visible area. */
export function stickLength(x: number, y: number, bx: number, by: number, bounds: Rect, max = LAYOUT.stickLength): number {
  const room = rayExit(x, y, bx, by, bounds) - LAYOUT.stickMargin;
  return Math.max(0, Math.min(max, room));
}

/** Keep a text line of size (w,h) centred on (x,y) fully inside a cssW x cssH canvas. */
export function placeText(x: number, y: number, w: number, h: number, cssW: number, cssH: number): { x: number; y: number } {
  const hx = Math.min(w / 2, cssW / 2); const hy = Math.min(h / 2, cssH / 2);
  return { x: Math.min(cssW - hx, Math.max(hx, x)), y: Math.min(cssH - hy, Math.max(hy, y)) };
}
