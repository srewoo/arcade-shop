// Maze parsing and tile queries. Pure data, no rendering.
import type { Access, MoveDir, Tile } from './types';
import { VEC } from './types';

export type Cell = 'wall' | 'floor' | 'door' | 'basket';
export const ITEM_NONE = 0;
export const ITEM_CRUMB = 1;
export const ITEM_SUGAR = 2;
export const ITEM_PISTOL = 3;

export interface MazeDef {
  readonly name: string;
  readonly rows: readonly string[];
  /** Biscuit's fixed patrol loop. */
  readonly route: readonly Tile[];
  /** Rest-phase corners, one per cat (smudge, biscuit, tuxedo, ginger). */
  readonly corners: readonly Tile[];
}

export interface Maze {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly cells: readonly Cell[];
  readonly items: Uint8Array;
  readonly start: Tile;
  readonly door: Tile;
  readonly exit: Tile;
  readonly basket: readonly Tile[];
  readonly cheese: Tile;
  readonly tunnelRows: readonly number[];
  readonly route: readonly Tile[];
  readonly corners: readonly Tile[];
  /** Crumbs + sugar cubes: what must be eaten to clear the level. */
  readonly edibleCount: number;
  readonly pistolCount: number;
}

const GLYPH: Readonly<Record<string, { cell: Cell; item: number }>> = {
  '#': { cell: 'wall', item: ITEM_NONE },
  '.': { cell: 'floor', item: ITEM_CRUMB },
  S: { cell: 'floor', item: ITEM_SUGAR },
  W: { cell: 'floor', item: ITEM_PISTOL },
  ' ': { cell: 'floor', item: ITEM_NONE },
  M: { cell: 'floor', item: ITEM_NONE },
  x: { cell: 'floor', item: ITEM_NONE },
  '-': { cell: 'door', item: ITEM_NONE },
  b: { cell: 'basket', item: ITEM_NONE },
};

function findGlyph(rows: readonly string[], ch: string): Tile {
  for (let row = 0; row < rows.length; row++) {
    const col = (rows[row] ?? '').indexOf(ch);
    if (col >= 0) return { col, row };
  }
  throw new Error(`maze is missing glyph '${ch}'`);
}

export function parseMaze(def: MazeDef): Maze {
  const { rows } = def;
  const cols = rows[0]?.length ?? 0;
  if (cols === 0) throw new Error('maze has no rows');
  const cells: Cell[] = [];
  const items = new Uint8Array(cols * rows.length);
  const basket: Tile[] = [];
  rows.forEach((line, row) => {
    if (line.length !== cols) throw new Error(`row ${row} has length ${line.length}, expected ${cols}`);
    [...line].forEach((ch, col) => {
      const g = GLYPH[ch];
      if (!g) throw new Error(`unknown glyph '${ch}' at ${col},${row}`);
      cells.push(g.cell);
      items[row * cols + col] = g.item;
      if (g.cell === 'basket') basket.push({ col, row });
    });
  });
  const door = findGlyph(rows, '-');
  const tunnelRows: number[] = [];
  for (let r = 0; r < rows.length; r++) {
    if (cells[r * cols] === 'floor' && cells[r * cols + cols - 1] === 'floor') tunnelRows.push(r);
  }
  let edible = 0;
  let pistols = 0;
  for (const it of items) {
    if (it === ITEM_CRUMB || it === ITEM_SUGAR) edible++;
    if (it === ITEM_PISTOL) pistols++;
  }
  return {
    name: def.name, cols, rows: rows.length, cells, items,
    start: findGlyph(rows, 'M'), door, exit: { col: door.col, row: door.row - 1 },
    basket, cheese: findGlyph(rows, 'x'), tunnelRows,
    route: def.route, corners: def.corners, edibleCount: edible, pistolCount: pistols,
  };
}

export const buildMaze = parseMaze;

export function cellAt(m: Maze, col: number, row: number): Cell {
  if (col < 0 || col >= m.cols) return m.tunnelRows.includes(row) ? 'floor' : 'wall';
  if (row < 0 || row >= m.rows) return 'wall';
  return m.cells[row * m.cols + col] ?? 'wall';
}

export function passable(m: Maze, col: number, row: number, access: Access): boolean {
  const c = cellAt(m, col, row);
  if (c === 'floor') return true;
  return access === 'home' && (c === 'door' || c === 'basket');
}

/** Real tile reached by stepping `dir` from (col,row), wrapping through the mouse-hole. */
export function neighbor(m: Maze, col: number, row: number, dir: MoveDir): Tile {
  const v = VEC[dir];
  let c = col + v.dx;
  if (m.tunnelRows.includes(row)) c = (c + m.cols) % m.cols;
  return { col: c, row: row + v.dy };
}

export function canMove(m: Maze, col: number, row: number, dir: MoveDir, access: Access): boolean {
  const n = neighbor(m, col, row, dir);
  return passable(m, n.col, n.row, access);
}

export function isEdge(m: Maze, col: number): boolean {
  return col < 0 || col >= m.cols;
}
