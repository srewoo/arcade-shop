// Maps the 10 x 12 board (row 0 is the feeder row) onto the canvas, leaving room for the HUD.
import { CONFIG } from '../config';

export interface Reserve { readonly top: number; readonly left: number; readonly right: number; readonly bottom: number }

export interface View {
  readonly pxW: number;
  readonly pxH: number;
  readonly dpr: number;
  /** Cell size in CSS px. */
  readonly cs: number;
  /** Top-left of the cell grid (row 0, column 0) in CSS px. */
  readonly ox: number;
  readonly oy: number;
  /** Frame padding around the grid. */
  readonly pad: number;
}

const MARGIN = 10;
const PAD_CELLS = 0.42;
const { cols, rows } = CONFIG.grid;

export function computeView(pxW: number, pxH: number, rawDpr: number, reserve: Reserve): View {
  const dpr = Math.min(2, Math.max(1, rawDpr));
  const availW = Math.max(40, pxW - reserve.left - reserve.right - MARGIN * 2);
  const availH = Math.max(40, pxH - reserve.top - reserve.bottom - MARGIN * 2);
  const cs = Math.max(8, Math.min(availW / (cols + PAD_CELLS * 2), availH / (rows + PAD_CELLS * 2)));
  const gridW = cols * cs;
  const gridH = rows * cs;
  const ox = reserve.left + MARGIN + (availW - gridW) / 2;
  const oy = reserve.top + MARGIN + (availH - gridH) / 2;
  return { pxW, pxH, dpr, cs, ox, oy, pad: PAD_CELLS * cs };
}

/** Grid cell under a CSS-px point (rows 1..11 only; the feeder row is not clickable), or null. */
export function cellAt(v: View, x: number, y: number): { col: number; row: number } | null {
  const col = Math.floor((x - v.ox) / v.cs);
  const row = Math.floor((y - v.oy) / v.cs);
  if (col < 0 || col >= cols || row < 1 || row >= rows) return null;
  return { col, row };
}

export const cellX = (v: View, col: number): number => v.ox + col * v.cs;
export const cellY = (v: View, row: number): number => v.oy + row * v.cs;
