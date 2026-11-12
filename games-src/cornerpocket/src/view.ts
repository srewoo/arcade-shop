// View transform between table coordinates and screen pixels. Portrait screens rotate the table 90 degrees.
import { RAIL, TABLE_H, TABLE_W } from './constants';

export interface View {
  portrait: boolean;
  scale: number;
  /** Canvas transform [a, b, c, d, e, f] (CSS px) mapping table coords to screen. */
  m: readonly [number, number, number, number, number, number];
}

const FULL_W = TABLE_W + 2 * RAIL;
const FULL_H = TABLE_H + 2 * RAIL;

export function layoutView(cssW: number, cssH: number): View {
  const portrait = cssH > cssW;
  const pw = portrait ? FULL_H : FULL_W;
  const ph = portrait ? FULL_W : FULL_H;
  const scale = Math.max(0.05, Math.min(cssW / pw, cssH / ph));
  const ox = (cssW - pw * scale) / 2;
  const oy = (cssH - ph * scale) / 2;
  const m: View['m'] = portrait
    ? [0, scale, -scale, 0, ox + scale * (RAIL + TABLE_H), oy + scale * RAIL]
    : [scale, 0, 0, scale, ox + scale * RAIL, oy + scale * RAIL];
  return { portrait, scale, m };
}

export function toScreen(v: View, x: number, y: number): { x: number; y: number } {
  const [a, b, c, d, e, f] = v.m;
  return { x: a * x + c * y + e, y: b * x + d * y + f };
}

export function toTable(v: View, sx: number, sy: number): { x: number; y: number } {
  const [a, b, c, d, e, f] = v.m;
  const det = a * d - b * c;
  const px = sx - e;
  const py = sy - f;
  return { x: (d * px - c * py) / det, y: (-b * px + a * py) / det };
}
