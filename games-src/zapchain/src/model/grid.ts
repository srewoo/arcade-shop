// Pure grid helpers: connected groups, floating discs, landing rows, base-row compaction.
import { CONFIG } from '../config';
import { BOMB, type Cells, type GroupCell, type Tile } from './types';

const { cols, rows, floorRow } = CONFIG.grid;

export const emptyCells = (): Cells => Array.from({ length: rows }, () => Array<Tile | null>(cols).fill(null));
export const inBounds = (c: number, r: number): boolean => c >= 0 && c < cols && r >= 1 && r <= floorRow;

const DIRS: readonly (readonly [number, number])[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * Connected same-colour group (4-neighbour) around (col,row), in breadth-first order. `parent`
 * indexes the cell it was reached from (-1 for the root), `depth` is the BFS ring: the zap arcs
 * use both. Bombs never join a group. Returns [] for an empty cell or a bomb.
 */
export function findGroup(cells: Cells, col: number, row: number): GroupCell[] {
  const root = inBounds(col, row) ? cells[row]?.[col] : null;
  if (!root || root.kind === BOMB) return [];
  const seen = new Set<number>([row * cols + col]);
  const out: GroupCell[] = [{ col, row, parent: -1, depth: 0 }];
  for (let i = 0; i < out.length; i++) {
    const cur = out[i] as GroupCell;
    for (const [dc, dr] of DIRS) {
      const c = cur.col + dc;
      const r = cur.row + dr;
      const key = r * cols + c;
      if (!inBounds(c, r) || seen.has(key)) continue;
      if (cells[r]?.[c]?.kind !== root.kind) continue;
      seen.add(key);
      out.push({ col: c, row: r, parent: i, depth: cur.depth + 1 });
    }
  }
  return out;
}

/** Whether any colour group of two or more exists (used to detect dead boards in the bot). */
export function hasMove(cells: Cells): boolean {
  for (let r = 1; r <= floorRow; r++) {
    for (let c = 0; c < cols; c++) {
      const t = cells[r]?.[c];
      if (!t) continue;
      if (t.kind === BOMB) return true;
      if (cells[r]?.[c + 1]?.kind === t.kind || cells[r + 1]?.[c]?.kind === t.kind) return true;
    }
  }
  return false;
}

/**
 * Take every tile that now has a gap below it out of the grid and return them (lowest first, so
 * callers can drop them in a stable order). Mutates `cells`.
 */
export function releaseFloating(cells: Cells): Tile[] {
  const out: Tile[] = [];
  for (let c = 0; c < cols; c++) {
    let gap = false;
    for (let r = floorRow; r >= 1; r--) {
      const t = cells[r]?.[c];
      if (!t) { gap = true; continue; }
      if (!gap) continue;
      (cells[r] as (Tile | null)[])[c] = null;
      out.push(t);
    }
  }
  return out;
}

/** Row a tile in column `col` that has reached float row `y` comes to rest on. */
export function restRow(cells: Cells, col: number, y: number): number {
  let r = Math.min(floorRow, Math.max(0, Math.floor(y)));
  while (r < floorRow && !cells[r + 1]?.[col]) r++;
  return r;
}

/** Highest occupied row of a column (rows..floor), or rows when empty. */
export function topRow(cells: Cells, col: number): number {
  for (let r = 1; r <= floorRow; r++) if (cells[r]?.[col]) return r;
  return rows;
}

/** Search order from the board centre outwards, to pick the anchor column for compaction. */
const CENTRE_ORDER = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9] as const;

/**
 * Base-row compaction: empty columns close up towards the centre. Given which base cells are
 * filled, returns the column shift (negative = left) for each column; 0 for no move.
 */
export function compactShifts(base: readonly boolean[]): number[] {
  const shifts = Array<number>(cols).fill(0);
  const mid = CENTRE_ORDER.find((c) => base[c]);
  if (mid === undefined) return shifts;
  let slide = 0;
  for (let c = mid; c < cols; c++) {
    if (base[c]) shifts[c] = slide;
    else slide--;
  }
  slide = 0;
  for (let c = mid - 1; c >= 0; c--) {
    if (base[c]) shifts[c] = slide;
    else slide++;
  }
  return shifts;
}
