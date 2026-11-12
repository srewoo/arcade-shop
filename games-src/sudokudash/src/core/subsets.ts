// Level 2: naked pairs and hidden pairs.
import { HOUSES, cellName, houseName } from './grid';
import { bit, digitsOf, popcount, type SolverState } from './candidates';
import { TECHNIQUE_LEVEL, type Elimination, type Step } from './steps';

const names = (cells: readonly number[]): string => cells.map(cellName).join(', ');

export function findNakedPair(state: SolverState): Step | null {
  for (const house of HOUSES) {
    const pairs = house.cells.filter((c) => state.grid[c] === 0 && popcount(state.cands[c] ?? 0) === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = pairs[i] as number;
        const b = pairs[j] as number;
        const mask = state.cands[a] ?? 0;
        if (mask !== state.cands[b]) continue;
        const elims: Elimination[] = [];
        for (const c of house.cells) {
          if (c === a || c === b || state.grid[c] !== 0) continue;
          for (const d of digitsOf(mask)) if ((state.cands[c] ?? 0) & bit(d)) elims.push({ cell: c, digit: d });
        }
        if (elims.length === 0) continue;
        const [d1, d2] = digitsOf(mask) as [number, number];
        const hit = [...new Set(elims.map((e) => e.cell))];
        return {
          technique: 'naked-pair',
          level: TECHNIQUE_LEVEL['naked-pair'],
          placement: null,
          eliminations: elims,
          focus: [a, b],
          region: [...house.cells],
          sources: [],
          targets: hit,
          message:
            `In ${houseName(house)}, ${cellName(a)} and ${cellName(b)} can only be ${d1} or ${d2}. ` +
            `Those two cells will use up both digits, so ${d1} and ${d2} can be removed from the other cells: ${names(hit)}.`,
        };
      }
    }
  }
  return null;
}

export function findHiddenPair(state: SolverState): Step | null {
  for (const house of HOUSES) {
    const spots = new Map<number, number[]>();
    for (let d = 1; d <= 9; d++) {
      const cells = house.cells.filter((c) => (state.cands[c] ?? 0) & bit(d));
      if (cells.length === 2) spots.set(d, cells);
    }
    const digits = [...spots.keys()];
    for (let i = 0; i < digits.length; i++) {
      for (let j = i + 1; j < digits.length; j++) {
        const d1 = digits[i] as number;
        const d2 = digits[j] as number;
        const c1 = spots.get(d1) as number[];
        const c2 = spots.get(d2) as number[];
        if (c1[0] !== c2[0] || c1[1] !== c2[1]) continue;
        const keep = bit(d1) | bit(d2);
        const elims: Elimination[] = [];
        for (const c of c1) {
          for (const d of digitsOf((state.cands[c] ?? 0) & ~keep)) elims.push({ cell: c, digit: d });
        }
        if (elims.length === 0) continue;
        return {
          technique: 'hidden-pair',
          level: TECHNIQUE_LEVEL['hidden-pair'],
          placement: null,
          eliminations: elims,
          focus: [...c1],
          region: [...house.cells],
          sources: [],
          targets: [...c1],
          message:
            `In ${houseName(house)}, the digits ${d1} and ${d2} can only go in ${names(c1)}. ` +
            `So those two cells must hold ${d1} and ${d2}, and every other candidate in them can be removed.`,
        };
      }
    }
  }
  return null;
}
