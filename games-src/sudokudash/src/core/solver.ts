// Logical solver: always applies the easiest available technique first.
import { CELLS } from './grid';
import { createState, hasDeadCell, type SolverState } from './candidates';
import { applyStep, snapshotStep, type Level, type Step } from './steps';
import { findHiddenSingle, findNakedSingle } from './singles';
import { findHiddenPair, findNakedPair } from './subsets';
import { findClaiming, findPointing } from './intersections';
import { findXWing } from './xwing';

type Finder = (state: SolverState) => Step | null;

export const FINDERS: readonly Finder[] = [
  findNakedSingle,
  findHiddenSingle,
  findNakedPair,
  findHiddenPair,
  findPointing,
  findClaiming,
  findXWing,
];

/** The next logical step for this state, or null when no supported technique applies. */
export function nextStep(state: SolverState, maxLevel: Level = 3): Step | null {
  for (const find of FINDERS) {
    const step = find(state);
    if (step && step.level <= maxLevel) return step;
  }
  return null;
}

export interface LogicalResult {
  readonly solved: boolean;
  readonly grid: number[];
  readonly steps: Step[];
  /** Hardest technique level used (0 when the grid was already complete). */
  readonly maxLevel: number;
}

/** Solve with human techniques only, up to `maxLevel`. `explain` keeps the text of each step (slower). */
export function solveLogically(grid: readonly number[], maxLevel: Level = 3, explain = false): LogicalResult {
  const state = createState(grid);
  const steps: Step[] = [];
  let hardest = 0;
  while (state.grid.some((d) => d === 0)) {
    if (hasDeadCell(state)) break;
    const step = nextStep(state, maxLevel);
    if (!step) break;
    const kept = explain ? snapshotStep(step) : step;
    applyStep(state, step);
    steps.push(kept);
    hardest = Math.max(hardest, step.level);
  }
  const solved = state.grid.length === CELLS && state.grid.every((d) => d !== 0);
  return { solved, grid: state.grid, steps, maxLevel: hardest };
}
