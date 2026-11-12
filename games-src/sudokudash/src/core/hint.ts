// Hints: turn the current game into the next explained logical step.
import { cellName } from './grid';
import { bit } from './candidates';
import { solveBacktracking } from './counter';
import { snapshotStep, type Step } from './steps';
import { nextStep } from './solver';
import { fillAllNotes, isSolved, isWrong, solverState, trustedGrid, type GameState } from './game';

export type Hint =
  | { readonly kind: 'solved' }
  | { readonly kind: 'mistake'; readonly cell: number; readonly message: string }
  | { readonly kind: 'step'; readonly step: Step }
  | { readonly kind: 'guess'; readonly cell: number; readonly digit: number; readonly message: string };

export function nextHint(s: GameState): Hint {
  if (isSolved(s)) return { kind: 'solved' };
  const wrong = s.values.findIndex((_, c) => isWrong(s, c));
  if (wrong >= 0) {
    return {
      kind: 'mistake',
      cell: wrong,
      message: `The ${s.values[wrong]} in ${cellName(wrong)} does not belong there. Erase it (Backspace) and try another digit.`,
    };
  }
  const st = solverState(s);
  const step = nextStep(st);
  if (step) return { kind: 'step', step: snapshotStep(step) };
  const grid = trustedGrid(s);
  const full = solveBacktracking(grid) ?? s.solution;
  const cell = grid.findIndex((d) => d === 0);
  const digit = full[cell] as number;
  return {
    kind: 'guess',
    cell,
    digit,
    message:
      `No supported technique (singles, pairs, pointing/claiming, X-wing) applies here, so this position needs trial and error. ` +
      `The solver's search says ${cellName(cell)} is ${digit}.`,
  };
}

/** Apply a hint to the game. Eliminations are remembered and shown as pencil marks. */
export function applyHint(s: GameState, hint: Hint): GameState {
  if (hint.kind === 'guess') return { ...s, values: s.values.map((v, i) => (i === hint.cell ? hint.digit : v)), notes: s.notes.map((m, i) => (i === hint.cell ? 0 : m)) };
  if (hint.kind === 'mistake') {
    return { ...s, values: s.values.map((v, i) => (i === hint.cell ? 0 : v)) };
  }
  if (hint.kind !== 'step') return s;
  const { step } = hint;
  if (step.placement) {
    const { cell, digit } = step.placement;
    const notes = s.notes.map((m, i) => (i === cell ? 0 : m));
    return { ...s, values: s.values.map((v, i) => (i === cell ? digit : v)), notes };
  }
  const elim = [...s.elim];
  for (const e of step.eliminations) elim[e.cell] = (elim[e.cell] ?? 0) | bit(e.digit);
  const withElim = { ...s, elim };
  const filled = fillAllNotes(withElim);
  const keep = s.values.map((v) => v !== 0);
  return { ...filled, notes: filled.notes.map((m, i) => (keep[i] ? 0 : m)) };
}
