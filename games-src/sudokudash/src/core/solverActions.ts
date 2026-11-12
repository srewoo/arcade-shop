// Pure helpers for the solver buttons and house-completion detection.
import { CELLS, HOUSES, boxOf, colOf, rowOf } from './grid';
import type { GameState } from './game';

/** Clears every wrong digit (used by Solve step when the hint is "mistake found"). */
export function eraseWrong(g: GameState): GameState {
  const values = g.values.map((v, i) => (v !== 0 && v !== g.solution[i] ? 0 : v));
  return { ...g, values };
}

/** The whole solution filled in, notes cleared. */
export const solveAllState = (g: GameState): GameState => ({
  ...g,
  values: [...g.solution],
  notes: new Array<number>(CELLS).fill(0),
});

/** Cells that are correct in `after` but were not in `before` (what a placement actually filled). */
export function newlyCorrect(before: GameState, after: GameState): number[] {
  const out: number[] = [];
  after.values.forEach((v, i) => {
    if (v !== 0 && v === after.solution[i] && before.values[i] !== v) out.push(i);
  });
  return out;
}

/** Cells of every row / column / box through `cell` that is now completely correct. */
export function completedHouseCells(g: GameState, cell: number): number[] {
  const out = new Set<number>();
  const wanted = [rowOf(cell), 9 + colOf(cell), 18 + boxOf(cell)];
  for (const hi of wanted) {
    const house = HOUSES[hi];
    if (house && house.cells.every((c) => g.values[c] === g.solution[c])) house.cells.forEach((c) => out.add(c));
  }
  return [...out];
}
