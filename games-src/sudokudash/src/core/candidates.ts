// Candidate bitmasks: bit (d-1) set means digit d is still possible in a cell.
import { CELLS, PEERS } from './grid';

export const ALL = 0x1ff;
export const bit = (d: number): number => 1 << (d - 1);

export function popcount(m: number): number {
  let n = 0;
  for (let x = m; x; x &= x - 1) n++;
  return n;
}

export function digitsOf(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
  return out;
}

export interface SolverState {
  readonly grid: number[];
  readonly cands: number[];
}

/** Candidates from the grid alone, minus any externally eliminated bits. */
export function createState(grid: readonly number[], eliminated?: readonly number[]): SolverState {
  const g = [...grid];
  const cands = new Array<number>(CELLS).fill(0);
  for (let c = 0; c < CELLS; c++) {
    if (g[c] !== 0) continue;
    let m = ALL;
    for (const p of PEERS[c] ?? []) {
      const d = g[p] ?? 0;
      if (d) m &= ~bit(d);
    }
    cands[c] = m & ~(eliminated?.[c] ?? 0);
  }
  return { grid: g, cands };
}

export function placeDigit(state: SolverState, cell: number, digit: number): void {
  state.grid[cell] = digit;
  state.cands[cell] = 0;
  for (const p of PEERS[cell] ?? []) state.cands[p] = (state.cands[p] ?? 0) & ~bit(digit);
}

/** True when some empty cell has no candidates left (the position is broken). */
export function hasDeadCell(state: SolverState): boolean {
  for (let c = 0; c < CELLS; c++) if (state.grid[c] === 0 && state.cands[c] === 0) return true;
  return false;
}
