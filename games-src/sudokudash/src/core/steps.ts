// A Step is one logical deduction: either a placement or a set of candidate eliminations.
import { bit, placeDigit, type SolverState } from './candidates';

export type Technique =
  | 'naked-single'
  | 'hidden-single'
  | 'naked-pair'
  | 'hidden-pair'
  | 'pointing'
  | 'claiming'
  | 'x-wing';

/** 1 = singles, 2 = pairs / pointing / claiming, 3 = X-wing. */
export type Level = 1 | 2 | 3;

export const TECHNIQUE_LEVEL: Readonly<Record<Technique, Level>> = {
  'naked-single': 1,
  'hidden-single': 1,
  'naked-pair': 2,
  'hidden-pair': 2,
  pointing: 2,
  claiming: 2,
  'x-wing': 3,
};

export const TECHNIQUE_LABEL: Readonly<Record<Technique, string>> = {
  'naked-single': 'Naked single',
  'hidden-single': 'Hidden single',
  'naked-pair': 'Naked pair',
  'hidden-pair': 'Hidden pair',
  pointing: 'Pointing pair',
  claiming: 'Box/line claiming',
  'x-wing': 'X-wing',
};

export interface Elimination {
  readonly cell: number;
  readonly digit: number;
}

export interface Step {
  readonly technique: Technique;
  readonly level: Level;
  readonly placement: { readonly cell: number; readonly digit: number } | null;
  readonly eliminations: readonly Elimination[];
  /** Cells that form the pattern (the pair, the X-wing corners, the single). */
  readonly focus: readonly number[];
  /** Cells of the house(s) the reasoning happens in. */
  readonly region: readonly number[];
  /** Cells holding digits that rule things out (blockers). */
  readonly sources: readonly number[];
  /** Cells that change (placement cell or cells losing candidates). */
  readonly targets: readonly number[];
  readonly message: string;
}

export function applyStep(state: SolverState, step: Step): void {
  if (step.placement) placeDigit(state, step.placement.cell, step.placement.digit);
  for (const e of step.eliminations) state.cands[e.cell] = (state.cands[e.cell] ?? 0) & ~bit(e.digit);
}

export const listCells = (cells: readonly number[]): string => cells.join(', ');

/**
 * Singles compute `message` and `sources` lazily from the live solver state. Call this
 * before the state changes to freeze them into plain data.
 */
export const snapshotStep = (step: Step): Step => ({ ...step, message: step.message, sources: step.sources });
