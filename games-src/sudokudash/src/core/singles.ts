// Level 1: naked singles and hidden singles.
import { CELLS, HOUSES, PEERS, cellName, houseName } from './grid';
import { bit, digitsOf, popcount, type SolverState } from './candidates';
import { TECHNIQUE_LEVEL, type Step } from './steps';

function seenDigits(state: SolverState, cell: number): number[] {
  const seen = new Set<number>();
  for (const p of PEERS[cell] ?? []) {
    const d = state.grid[p] ?? 0;
    if (d) seen.add(d);
  }
  return [...seen].sort((a, b) => a - b);
}

export function findNakedSingle(state: SolverState): Step | null {
  for (let cell = 0; cell < CELLS; cell++) {
    const m = state.cands[cell] ?? 0;
    if (state.grid[cell] !== 0 || popcount(m) !== 1) continue;
    const digit = digitsOf(m)[0] as number;
    return {
      technique: 'naked-single',
      level: TECHNIQUE_LEVEL['naked-single'],
      placement: { cell, digit },
      eliminations: [],
      focus: [cell],
      region: [cell, ...(PEERS[cell] ?? [])],
      targets: [cell],
      get sources() {
        return (PEERS[cell] ?? []).filter((p) => (state.grid[p] ?? 0) !== 0);
      },
      get message() {
        const seen = seenDigits(state, cell);
        const why =
          seen.length === 8
            ? `the other eight digits (${seen.join(', ')}) already appear in its row, column or box`
            : `every other digit is ruled out by its row, column and box (and earlier eliminations)`;
        return `${cellName(cell)} can only be ${digit}: ${why}.`;
      },
    };
  }
  return null;
}

/** Digits that occur as a candidate in exactly one cell of the house (and are not yet placed). */
function uniqueDigits(state: SolverState, cells: readonly number[]): number {
  let once = 0;
  let twice = 0;
  let placed = 0;
  for (const c of cells) {
    const m = state.cands[c] ?? 0;
    twice |= once & m;
    once |= m;
    if (state.grid[c]) placed |= bit(state.grid[c] as number);
  }
  return once & ~twice & ~placed;
}

export function findHiddenSingle(state: SolverState): Step | null {
  for (const house of HOUSES) {
    const unique = uniqueDigits(state, house.cells);
    if (unique === 0) continue;
    const digit = digitsOf(unique)[0] as number;
    const cell = house.cells.find((c) => (state.cands[c] ?? 0) & bit(digit)) as number;
    const where = houseName(house);
    return {
      technique: 'hidden-single',
      level: TECHNIQUE_LEVEL['hidden-single'],
      placement: { cell, digit },
      eliminations: [],
      focus: [cell],
      region: [...house.cells],
      targets: [cell],
      get sources() {
        const out = new Set<number>();
        for (const o of house.cells) {
          if (state.grid[o] !== 0 || o === cell) continue;
          for (const p of PEERS[o] ?? []) if (state.grid[p] === digit) out.add(p);
        }
        return [...out];
      },
      get message() {
        return (
          `Only ${digit} fits in ${cellName(cell)} for ${where}: the ${digit} of ${where} must go somewhere, ` +
          `and every other empty cell there is blocked from ${digit} by a ${digit} in its own row, column or box ` +
          `(or an earlier elimination).`
        );
      },
    };
  }
  return null;
}
