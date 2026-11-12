// Pure match rules: flood fill, bombs, floating detection, ceiling drop.
import { TUNING } from './config';
import { Bubble, Cell, Grid, Pos, forEachBubble, getCell, neighbours, rowLen, setCell } from './hex';

export const MIN_MATCH = 3;
const key = (p: Pos): string => `${p.row},${p.col}`;

const matches = (b: Bubble, color: number): boolean =>
  (b.kind === 'normal' && b.color === color) || b.kind === 'rainbow';

/** Connected same-colour group (rainbow bubbles count as wildcards). */
export function floodMatch(grid: Grid, start: Pos, color: number): Pos[] {
  const first = getCell(grid, start.row, start.col);
  if (!first || !matches(first, color)) return [];
  const seen = new Set<string>([key(start)]);
  const queue: Pos[] = [start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as Pos;
    for (const n of neighbours(cur.row, cur.col, grid.phase)) {
      const b = getCell(grid, n.row, n.col);
      if (!b || seen.has(key(n)) || !matches(b, color)) continue;
      seen.add(key(n));
      queue.push(n);
    }
  }
  return queue;
}

/** Colours of ordinary bubbles touching a cell. */
function touchingColors(grid: Grid, p: Pos): number[] {
  const out = new Set<number>();
  for (const n of neighbours(p.row, p.col, grid.phase)) {
    const b = getCell(grid, n.row, n.col);
    if (b?.kind === 'normal') out.add(b.color);
  }
  return [...out];
}

/** Cells a normal or rainbow bubble pops when it lands at `p` ([] if < 3). */
export function matchGroup(grid: Grid, p: Pos): Pos[] {
  const landed = getCell(grid, p.row, p.col);
  if (!landed) return [];
  const colors = landed.kind === 'rainbow' ? touchingColors(grid, p) : [landed.color];
  let best: Pos[] = [];
  for (const c of colors) {
    const group = floodMatch(grid, p, c);
    if (group.length > best.length) best = group;
  }
  return best.length >= MIN_MATCH ? best : [];
}

/** Bomb blast: everything within two hex steps except stones. */
export function bombCells(grid: Grid, p: Pos, radius: number = TUNING.specials.bombRadius): Pos[] {
  const seen = new Map<string, number>([[key(p), 0]]);
  const queue: Pos[] = [p];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as Pos;
    const d = seen.get(key(cur)) as number;
    if (d >= radius) continue;
    for (const n of neighbours(cur.row, cur.col, grid.phase)) {
      if (seen.has(key(n))) continue;
      seen.set(key(n), d + 1);
      queue.push(n);
    }
  }
  return queue.filter((q) => {
    const b = getCell(grid, q.row, q.col);
    return b !== null && b.kind !== 'stone';
  });
}

/** Cells that are no longer connected to the ceiling row. */
export function findFloating(grid: Grid): Pos[] {
  const anchored = new Set<string>();
  const queue: Pos[] = [];
  (grid.rows[0] ?? []).forEach((b, col) => {
    if (b) {
      anchored.add(key({ row: 0, col }));
      queue.push({ row: 0, col });
    }
  });
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i] as Pos;
    for (const n of neighbours(cur.row, cur.col, grid.phase)) {
      if (!getCell(grid, n.row, n.col) || anchored.has(key(n))) continue;
      anchored.add(key(n));
      queue.push(n);
    }
  }
  const out: Pos[] = [];
  forEachBubble(grid, (_b, p) => {
    if (!anchored.has(key(p))) out.push(p);
  });
  return out;
}

/** Drop trailing rows that hold no bubbles, so `rows` stays bounded in long runs. */
export function trimRows(grid: Grid): void {
  while (grid.rows.length > 0 && !grid.rows[grid.rows.length - 1]?.some(Boolean)) grid.rows.pop();
}

export function removeCells(grid: Grid, cells: readonly Pos[]): Bubble[] {
  const removed: Bubble[] = [];
  for (const p of cells) {
    const b = getCell(grid, p.row, p.col);
    if (b) removed.push(b);
    setCell(grid, p.row, p.col, null);
  }
  trimRows(grid);
  return removed;
}

/** True when nothing but stones (or nothing at all) is left to clear. */
export function isCleared(grid: Grid): boolean {
  let left = false;
  forEachBubble(grid, (b) => {
    if (b.kind !== 'stone') left = true;
  });
  return !left;
}

/** Ceiling drop: every row moves down one and a fresh top row is inserted. */
export function dropCeiling(grid: Grid, fill: (len: number) => Cell[]): void {
  grid.phase = grid.phase === 0 ? 1 : 0;
  grid.rows.unshift(fill(rowLen(0, grid.phase)));
  trimRows(grid);
}
