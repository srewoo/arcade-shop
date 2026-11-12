// Backtracking solver and solution counter (MRV heuristic, bitmask masks).
import { CELLS, boxOf, colOf, rowOf } from './grid';
import { ALL, bit, digitsOf, popcount } from './candidates';
import { shuffle, type Rng } from './rng';

interface Result {
  count: number;
  first: number[] | null;
}

function search(input: readonly number[], limit: number, rng?: Rng): Result {
  const g = [...input];
  const rows = new Array<number>(9).fill(0);
  const cols = new Array<number>(9).fill(0);
  const boxes = new Array<number>(9).fill(0);
  for (let c = 0; c < CELLS; c++) {
    const d = g[c] ?? 0;
    if (d === 0) continue;
    const b = bit(d);
    if ((rows[rowOf(c)]! | cols[colOf(c)]! | boxes[boxOf(c)]!) & b) return { count: 0, first: null };
    rows[rowOf(c)]! |= b;
    cols[colOf(c)]! |= b;
    boxes[boxOf(c)]! |= b;
  }
  const res: Result = { count: 0, first: null };

  const avail = (c: number): number => ALL & ~(rows[rowOf(c)]! | cols[colOf(c)]! | boxes[boxOf(c)]!);

  const recurse = (): void => {
    let best = -1;
    let bestN = 10;
    for (let c = 0; c < CELLS; c++) {
      if (g[c] !== 0) continue;
      const n = popcount(avail(c));
      if (n < bestN) {
        best = c;
        bestN = n;
        if (n <= 1) break;
      }
    }
    if (best < 0) {
      res.count++;
      res.first ??= [...g];
      return;
    }
    let digits = digitsOf(avail(best));
    if (rng) digits = shuffle(digits, rng);
    for (const d of digits) {
      const b = bit(d);
      g[best] = d;
      rows[rowOf(best)]! |= b;
      cols[colOf(best)]! |= b;
      boxes[boxOf(best)]! |= b;
      recurse();
      rows[rowOf(best)]! &= ~b;
      cols[colOf(best)]! &= ~b;
      boxes[boxOf(best)]! &= ~b;
      g[best] = 0;
      if (res.count >= limit) return;
    }
  };
  recurse();
  return res;
}

/** Count solutions, stopping as soon as `limit` (default 2) have been found. */
export const countSolutions = (grid: readonly number[], limit = 2): number => search(grid, limit).count;

/** One solution (first found) or null. */
export const solveBacktracking = (grid: readonly number[]): number[] | null => search(grid, 1).first;

/** A uniformly shuffled, complete, valid grid. */
export function randomSolvedGrid(rng: Rng): number[] {
  const solved = search(new Array<number>(CELLS).fill(0), 1, rng).first;
  if (!solved) throw new Error('could not fill an empty grid');
  return solved;
}
