// Level 2: pointing pairs/triples (box -> line) and claiming (line -> box).
import { BOXES, COLS, ROWS, boxOf, cellName, colOf, houseName, rowOf, type House } from './grid';
import { bit, type SolverState } from './candidates';
import { TECHNIQUE_LEVEL, type Elimination, type Step } from './steps';

const hasDigit = (state: SolverState, c: number, d: number): boolean => ((state.cands[c] ?? 0) & bit(d)) !== 0;

function eliminations(state: SolverState, from: readonly number[], skip: ReadonlySet<number>, d: number): Elimination[] {
  return from.filter((c) => !skip.has(c) && hasDigit(state, c, d)).map((cell) => ({ cell, digit: d }));
}

/** Pointing: all candidates for d in a box lie on one line, so the rest of the line loses d. */
export function findPointing(state: SolverState): Step | null {
  for (const box of BOXES) {
    for (let d = 1; d <= 9; d++) {
      const cells = box.cells.filter((c) => hasDigit(state, c, d));
      if (cells.length < 2) continue;
      const sameRow = cells.every((c) => rowOf(c) === rowOf(cells[0] as number));
      const sameCol = cells.every((c) => colOf(c) === colOf(cells[0] as number));
      if (!sameRow && !sameCol) continue;
      const line = (sameRow ? ROWS[rowOf(cells[0] as number)] : COLS[colOf(cells[0] as number)]) as House;
      const elims = eliminations(state, line.cells, new Set(cells), d);
      if (elims.length === 0) continue;
      return {
        technique: 'pointing',
        level: TECHNIQUE_LEVEL.pointing,
        placement: null,
        eliminations: elims,
        focus: cells,
        region: [...new Set([...box.cells, ...line.cells])],
        sources: [],
        targets: elims.map((e) => e.cell),
        message:
          `In ${houseName(box)}, every spot left for ${d} (${cells.map(cellName).join(', ')}) lies in ${houseName(line)}. ` +
          `So the ${d} of that box must be in ${houseName(line)}, and ${d} can be removed from the rest of the line: ` +
          `${elims.map((e) => cellName(e.cell)).join(', ')}.`,
      };
    }
  }
  return null;
}

/** Claiming: all candidates for d in a line lie in one box, so the rest of the box loses d. */
export function findClaiming(state: SolverState): Step | null {
  for (const line of [...ROWS, ...COLS]) {
    for (let d = 1; d <= 9; d++) {
      const cells = line.cells.filter((c) => hasDigit(state, c, d));
      if (cells.length < 2) continue;
      const b = boxOf(cells[0] as number);
      if (!cells.every((c) => boxOf(c) === b)) continue;
      const box = BOXES[b] as House;
      const elims = eliminations(state, box.cells, new Set(cells), d);
      if (elims.length === 0) continue;
      return {
        technique: 'claiming',
        level: TECHNIQUE_LEVEL.claiming,
        placement: null,
        eliminations: elims,
        focus: cells,
        region: [...new Set([...box.cells, ...line.cells])],
        sources: [],
        targets: elims.map((e) => e.cell),
        message:
          `In ${houseName(line)}, every spot left for ${d} (${cells.map(cellName).join(', ')}) lies in ${houseName(box)}. ` +
          `So the ${d} of the line must be in that box, and ${d} can be removed from the other cells of the box: ` +
          `${elims.map((e) => cellName(e.cell)).join(', ')}.`,
      };
    }
  }
  return null;
}
