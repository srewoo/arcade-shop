// Pure board rules: columns are stacks (index 0 = bottom). Empty columns are
// always compacted to the right edge, which is the "columns slide left" rule.
export interface Pt {
  readonly x: number;
  readonly y: number;
}
export interface Board {
  readonly width: number;
  readonly height: number;
  readonly cols: readonly (readonly number[])[];
}
export interface Move {
  readonly from: Pt;
  readonly to: Pt;
}
export interface Removed extends Pt {
  readonly colour: number;
}
export interface ClearResult {
  readonly board: Board;
  readonly removed: readonly Removed[];
  readonly moves: readonly Move[];
}

/** Build a board from column stacks, compacting empty columns to the right. */
export function makeBoard(cols: readonly (readonly number[])[], width: number, height: number): Board {
  const kept = cols.filter((c) => c.length > 0).map((c) => c.slice(0, height));
  while (kept.length < width) kept.push([]);
  return { width, height, cols: kept.slice(0, width) };
}

/** Test/debug helper: rows top-first, digits are colours, "." is empty. */
export function boardFromRows(rows: readonly string[], height = rows.length): Board {
  const width = Math.max(...rows.map((r) => r.length));
  const cols: number[][] = [];
  for (let x = 0; x < width; x++) {
    const stack: number[] = [];
    for (let r = rows.length - 1; r >= 0; r--) {
      const ch = rows[r]?.[x];
      if (ch !== undefined && ch >= '0' && ch <= '9') stack.push(Number(ch));
    }
    cols.push(stack);
  }
  return makeBoard(cols, width, height);
}

export const cellAt = (b: Board, x: number, y: number): number | undefined => b.cols[x]?.[y];

/** Connected same-colour cells (4-neighbour) around (x, y); [] when fewer than 2. */
export function findGroup(b: Board, x: number, y: number): Pt[] {
  const colour = cellAt(b, x, y);
  if (colour === undefined) return [];
  const seen = new Set<number>([x * b.height + y]);
  const out: Pt[] = [{ x, y }];
  for (let i = 0; i < out.length; i++) {
    const p = out[i];
    if (!p) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      const key = nx * b.height + ny;
      if (!seen.has(key) && cellAt(b, nx, ny) === colour) {
        seen.add(key);
        out.push({ x: nx, y: ny });
      }
    }
  }
  return out.length >= 2 ? out : [];
}

/** Every group of 2+ on the board. */
export function allGroups(b: Board): Pt[][] {
  const done = new Set<number>();
  const groups: Pt[][] = [];
  for (let x = 0; x < b.width; x++) {
    for (let y = 0; y < (b.cols[x]?.length ?? 0); y++) {
      if (done.has(x * b.height + y)) continue;
      const g = findGroup(b, x, y);
      if (g.length === 0) done.add(x * b.height + y);
      for (const p of g) done.add(p.x * b.height + p.y);
      if (g.length > 0) groups.push(g);
    }
  }
  return groups;
}

export function hasMoves(b: Board): boolean {
  for (let x = 0; x < b.width; x++) {
    const col = b.cols[x] ?? [];
    for (let y = 0; y < col.length; y++) {
      if (col[y] === col[y + 1] || col[y] === b.cols[x + 1]?.[y]) return true;
    }
  }
  return false;
}

export const discCount = (b: Board): number => b.cols.reduce((n, c) => n + c.length, 0);
export const isEmpty = (b: Board): boolean => discCount(b) === 0;

/** Remove a group: discs fall, columns slide left. Reports where survivors went. */
export function clearGroup(b: Board, group: readonly Pt[]): ClearResult {
  const gone = new Set(group.map((p) => p.x * b.height + p.y));
  const removed: Removed[] = group.map((p) => ({ ...p, colour: cellAt(b, p.x, p.y) ?? -1 }));
  const moves: Move[] = [];
  const next: number[][] = [];
  for (let x = 0; x < b.width; x++) {
    const stack: number[] = [];
    (b.cols[x] ?? []).forEach((colour, y) => {
      if (gone.has(x * b.height + y)) return;
      if (x !== next.length || y !== stack.length) moves.push({ from: { x, y }, to: { x: next.length, y: stack.length } });
      stack.push(colour);
    });
    if (stack.length > 0) next.push(stack);
  }
  return { board: makeBoard(next, b.width, b.height), removed, moves };
}

/** Add a column at the first free slot on the right; null when the board is full. */
export function addColumn(b: Board, colours: readonly number[]): { board: Board; x: number } | null {
  const x = b.cols.findIndex((c) => c.length === 0);
  if (x < 0) return null;
  const cols = b.cols.map((c, i) => (i === x ? colours.slice(0, b.height) : c));
  return { board: { ...b, cols }, x };
}

export const boardKey = (b: Board): string => b.cols.map((c) => c.join('')).join('|');
