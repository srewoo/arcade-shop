// Pure board logic: 10 wide, 20 visible rows plus 2 hidden rows on top.
import { cellsOf, GARBAGE_CELL, shapeIndex, type ShapeId } from './shapes';
import type { Rng } from './rng';

export const WIDTH = 10;
export const VISIBLE = 20;
export const HIDDEN = 2;
export const HEIGHT = VISIBLE + HIDDEN;

export type Board = number[][];

export interface Piece {
  id: ShapeId;
  rot: number;
  x: number; // top-left of the bounding box
  y: number;
}

export const createBoard = (): Board => Array.from({ length: HEIGHT }, () => new Array<number>(WIDTH).fill(0));
export const cloneBoard = (b: Board): Board => b.map((r) => [...r]);

/** True when the piece placed at (x, y, rot) leaves the well or overlaps a cell. */
export function collides(board: Board, id: ShapeId, rot: number, x: number, y: number): boolean {
  for (const [cx, cy] of cellsOf(id, rot)) {
    const bx = x + cx;
    const by = y + cy;
    if (bx < 0 || bx >= WIDTH || by < 0 || by >= HEIGHT) return true;
    if ((board[by] as number[])[bx] !== 0) return true;
  }
  return false;
}

export function placePiece(board: Board, p: Piece): void {
  const v = shapeIndex(p.id);
  for (const [cx, cy] of cellsOf(p.id, p.rot)) (board[p.y + cy] as number[])[p.x + cx] = v;
}

export function fullRows(board: Board): number[] {
  const rows: number[] = [];
  board.forEach((r, i) => {
    if (r.every((c) => c !== 0)) rows.push(i);
  });
  return rows;
}

/** Remove the given rows and drop everything above. Returns how many were removed. */
export function clearRows(board: Board, rows: readonly number[]): number {
  const kept = board.filter((_, i) => !rows.includes(i));
  while (kept.length < HEIGHT) kept.unshift(new Array<number>(WIDTH).fill(0));
  kept.forEach((r, i) => (board[i] = r));
  return rows.length;
}

export const isBoardEmpty = (b: Board): boolean => b.every((r) => r.every((c) => c === 0));
export const countGarbage = (b: Board): number => b.reduce((n, r) => n + r.filter((c) => c === GARBAGE_CELL).length, 0);

export function garbageRow(hole: number): number[] {
  return Array.from({ length: WIDTH }, (_, x) => (x === hole ? 0 : GARBAGE_CELL));
}

/** Push a garbage row in from below. Returns true if a filled row was pushed out of the top. */
export function addGarbageRow(board: Board, hole: number): boolean {
  const top = board.shift() as number[];
  board.push(garbageRow(hole));
  return top.some((c) => c !== 0);
}

/** Pre-fill the bottom `rows` rows with garbage (one hole per row, wandering). */
export function fillGarbage(board: Board, rows: number, rng: Rng): void {
  let hole = rng.int(WIDTH);
  for (let i = 0; i < rows; i++) {
    if (rng.next() < 0.7) hole = rng.int(WIDTH);
    board[HEIGHT - 1 - i] = garbageRow(hole);
  }
}
