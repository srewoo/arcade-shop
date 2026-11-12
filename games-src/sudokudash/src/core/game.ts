// Game state operations. States are treated as immutable: every operation returns a copy.
import { CELLS, PEERS, findConflicts } from './grid';
import { ALL, bit, createState, type SolverState } from './candidates';

export interface GameState {
  readonly puzzle: readonly number[];
  readonly solution: readonly number[];
  readonly values: readonly number[];
  /** Pencil marks per cell (bitmask). */
  readonly notes: readonly number[];
  /** Candidates ruled out by solver steps the player applied. */
  readonly elim: readonly number[];
}

export type Outcome = 'correct' | 'mistake' | 'noop';

export function newGame(puzzle: readonly number[], solution: readonly number[]): GameState {
  return { puzzle, solution, values: [...puzzle], notes: new Array<number>(CELLS).fill(0), elim: new Array<number>(CELLS).fill(0) };
}

export const isGiven = (s: GameState, cell: number): boolean => (s.puzzle[cell] ?? 0) !== 0;
export const isCorrect = (s: GameState, cell: number): boolean => s.values[cell] === s.solution[cell];
/** Filled by the player with a digit that is not the solution. */
export const isWrong = (s: GameState, cell: number): boolean => (s.values[cell] ?? 0) !== 0 && !isCorrect(s, cell);
export const isLocked = (s: GameState, cell: number): boolean => isGiven(s, cell) || ((s.values[cell] ?? 0) !== 0 && isCorrect(s, cell));
export const isSolved = (s: GameState): boolean => s.values.every((v, i) => v === s.solution[i]);

function withCell(arr: readonly number[], cell: number, value: number): number[] {
  const out = [...arr];
  out[cell] = value;
  return out;
}

/** Place a digit. Correct digits lock the cell; wrong ones count as a mistake and can be erased. */
export function enterDigit(s: GameState, cell: number, digit: number, autoRemoveNotes: boolean): { state: GameState; outcome: Outcome } {
  if (isLocked(s, cell) || s.values[cell] === digit) return { state: s, outcome: 'noop' };
  const correct = s.solution[cell] === digit;
  let notes = withCell(s.notes, cell, 0);
  if (correct && autoRemoveNotes) {
    notes = notes.map((m, c) => (PEERS[cell]?.includes(c) ? m & ~bit(digit) : m));
  }
  return { state: { ...s, values: withCell(s.values, cell, digit), notes }, outcome: correct ? 'correct' : 'mistake' };
}

export function toggleNote(s: GameState, cell: number, digit: number): GameState {
  if ((s.values[cell] ?? 0) !== 0) return s;
  return { ...s, notes: withCell(s.notes, cell, (s.notes[cell] ?? 0) ^ bit(digit)) };
}

export function eraseCell(s: GameState, cell: number): GameState {
  if (isLocked(s, cell)) return s;
  if ((s.values[cell] ?? 0) === 0 && (s.notes[cell] ?? 0) === 0) return s;
  return { ...s, values: withCell(s.values, cell, 0), notes: withCell(s.notes, cell, 0) };
}

/** Digits the player has placed correctly (wrong entries are treated as empty). */
export const trustedGrid = (s: GameState): number[] => s.values.map((v, i) => (v === s.solution[i] ? v : 0));

/** Solver view of the game: candidates from correct digits, minus applied eliminations. */
export const solverState = (s: GameState): SolverState => createState(trustedGrid(s), s.elim);

/** How many of each digit are still to be placed (index 1-9). */
export function remainingCounts(s: GameState): number[] {
  const out = new Array<number>(10).fill(9);
  s.values.forEach((v, i) => {
    if (v !== 0 && v === s.solution[i]) out[v] = (out[v] ?? 9) - 1;
  });
  return out;
}

/** Cells in a rule clash (the same digit twice in a row, column or box). */
export const conflictCells = (s: GameState): Set<number> => findConflicts(s.values);

/** Fill pencil marks for all empty cells from the current candidates. */
export function fillAllNotes(s: GameState): GameState {
  const st = solverState(s);
  return { ...s, notes: s.values.map((v, c) => (v !== 0 && v === s.solution[c] ? 0 : (st.cands[c] ?? 0) & ALL)) };
}
