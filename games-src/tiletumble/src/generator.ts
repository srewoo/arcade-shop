// Board generation. Boards are validated with the solver so every puzzle can be
// played down to a small remainder (no hopeless deals).
import { discCount, makeBoard, type Board } from './board';
import { CONFIG } from './config';
import { Rng } from './rng';
import { solve, type SolveResult } from './solver';

export interface Puzzle {
  readonly board: Board;
  readonly attempt: number;
  readonly solution: SolveResult;
  readonly valid: boolean;
}

export function randomColumn(rng: Rng, colours: number, min: number, max: number): number[] {
  const n = rng.int(min, max);
  return Array.from({ length: n }, () => rng.int(0, colours - 1));
}

export function randomBoard(rng: Rng, width: number, height: number, colours: number): Board {
  const cols = Array.from({ length: width }, () => Array.from({ length: height }, () => rng.int(0, colours - 1)));
  return makeBoard(cols, width, height);
}

function colourCounts(b: Board, colours: number): number[] {
  const counts = new Array<number>(colours).fill(0);
  for (const col of b.cols) for (const c of col) counts[c] = (counts[c] ?? 0) + 1;
  return counts;
}

export function isValidDeal(b: Board, colours: number, solution: SolveResult): boolean {
  const { minPerColour, maxLeftoverShare } = CONFIG.validation;
  const balanced = colourCounts(b, colours).every((n) => n >= minPerColour);
  return balanced && solution.leftover <= maxLeftoverShare * discCount(b);
}

const attemptSeed = (seed: number, attempt: number): number => (seed + Math.imul(attempt, 0x9e3779b1)) >>> 0;

/** Deterministic: the same (seed, colours) always yields the same board. */
export function generatePuzzle(seed: number, colours: number): Puzzle {
  const { cols, rows } = CONFIG.board;
  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < CONFIG.validation.maxAttempts; attempt++) {
    const board = randomBoard(new Rng(attemptSeed(seed, attempt)), cols, rows, colours);
    const solution = solve(board);
    const valid = isValidDeal(board, colours, solution);
    const puzzle = { board, attempt, solution, valid };
    if (valid) return puzzle;
    if (!fallback || solution.leftover < fallback.solution.leftover) fallback = puzzle;
  }
  return fallback as Puzzle;
}
