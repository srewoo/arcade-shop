// Pure hex-grid geometry: coordinates, neighbours, snapping. No DOM.
// Rows are offset by half a bubble. Which rows are offset depends on `phase`,
// which flips every time the ceiling drops (data shifts down one row).
import { TUNING } from './config';

export const R = 16;
export const COLS = 11;
export const W = COLS * R * 2;
export const H = 520;
export const TOP_Y = 18;
export const ROW_H = Math.round(R * Math.sqrt(3) * 100) / 100;
export const DANGER_ROW = TUNING.arcade.dangerRow;
export const SHOOTER = { x: W / 2, y: H - 58 } as const;

export type Kind = 'normal' | 'bomb' | 'rainbow' | 'stone';
export interface Bubble {
  readonly kind: Kind;
  /** Colour index; -1 for kinds without a colour. */
  readonly color: number;
}
export type Cell = Bubble | null;
export interface Pos {
  readonly row: number;
  readonly col: number;
}
export type Phase = 0 | 1;
export interface Grid {
  rows: Cell[][];
  phase: Phase;
}

export const isShifted = (row: number, phase: Phase): boolean => (row + phase) % 2 === 1;
export const rowLen = (row: number, phase: Phase): number => (isShifted(row, phase) ? COLS - 1 : COLS);

export function createGrid(phase: Phase = 0): Grid {
  return { rows: [], phase };
}

export function inBounds(row: number, col: number, phase: Phase): boolean {
  return row >= 0 && col >= 0 && col < rowLen(row, phase);
}

export function getCell(grid: Grid, row: number, col: number): Cell {
  if (!inBounds(row, col, grid.phase)) return null;
  return grid.rows[row]?.[col] ?? null;
}

export function setCell(grid: Grid, row: number, col: number, value: Cell): void {
  if (!inBounds(row, col, grid.phase)) throw new RangeError(`cell ${row},${col} out of bounds`);
  while (grid.rows.length <= row) {
    grid.rows.push(new Array<Cell>(rowLen(grid.rows.length, grid.phase)).fill(null));
  }
  (grid.rows[row] as Cell[])[col] = value;
}

/** Six neighbours of a cell (only those inside the playfield). */
export function neighbours(row: number, col: number, phase: Phase): Pos[] {
  const dc = isShifted(row, phase) ? [0, 1] : [-1, 0];
  const out: Pos[] = [
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];
  for (const dr of [-1, 1]) for (const d of dc) out.push({ row: row + dr, col: col + d });
  return out.filter((p) => inBounds(p.row, p.col, phase));
}

export function cellCenter(row: number, col: number, phase: Phase): { x: number; y: number } {
  const shift = isShifted(row, phase) ? R : 0;
  return { x: R + 2 * R * col + shift, y: TOP_Y + R + row * ROW_H };
}

export function forEachBubble(grid: Grid, fn: (b: Bubble, p: Pos) => void): void {
  grid.rows.forEach((cells, row) =>
    cells.forEach((b, col) => {
      if (b) fn(b, { row, col });
    }),
  );
}

export function bubbleCount(grid: Grid): number {
  let n = 0;
  forEachBubble(grid, () => n++);
  return n;
}

/** Highest occupied row index, or -1 for an empty grid. */
export function lowestRow(grid: Grid): number {
  for (let r = grid.rows.length - 1; r >= 0; r--) if (grid.rows[r]?.some(Boolean)) return r;
  return -1;
}

/** Nearest empty in-bounds cell to a pixel position within `radius` rows/cols, or null. */
export function nearestFreeCell(grid: Grid, x: number, y: number, radius = 1): Pos | null {
  const baseRow = Math.round((y - TOP_Y - R) / ROW_H);
  let best: Pos | null = null;
  let bestD = Infinity;
  for (let row = Math.max(0, baseRow - radius); row <= baseRow + radius; row++) {
    const shift = isShifted(row, grid.phase) ? R : 0;
    const baseCol = Math.round((x - R - shift) / (2 * R));
    for (let col = baseCol - radius; col <= baseCol + radius; col++) {
      if (!inBounds(row, col, grid.phase) || getCell(grid, row, col)) continue;
      const c = cellCenter(row, col, grid.phase);
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { row, col };
      }
    }
  }
  return best;
}

/** Fallback landing cell: widen the search, then scan every row down to the danger row. */
export function landingCell(grid: Grid, x: number, y: number): Pos | null {
  const near = nearestFreeCell(grid, x, y, 1) ?? nearestFreeCell(grid, x, y, 3);
  if (near) return near;
  const last = Math.max(lowestRow(grid) + 2, DANGER_ROW);
  let best: Pos | null = null;
  let bestD = Infinity;
  for (let row = 0; row <= last; row++) {
    for (let col = 0; col < rowLen(row, grid.phase); col++) {
      if (getCell(grid, row, col)) continue;
      const c = cellCenter(row, col, grid.phase);
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { row, col };
      }
    }
  }
  return best;
}

/** True when a ball centred at (x, y) touches the ceiling or any bubble. */
export function hitsBubble(grid: Grid, x: number, y: number): boolean {
  if (y - R <= TOP_Y) return true;
  const baseRow = Math.round((y - TOP_Y - R) / ROW_H);
  const limit = (R * 1.8) ** 2;
  for (let row = Math.max(0, baseRow - 2); row <= baseRow + 2; row++) {
    const cells = grid.rows[row];
    if (!cells) continue;
    for (let col = 0; col < cells.length; col++) {
      if (!cells[col]) continue;
      const c = cellCenter(row, col, grid.phase);
      if ((c.x - x) ** 2 + (c.y - y) ** 2 < limit) return true;
    }
  }
  return false;
}
