// Puzzle generator: random solved grid, then remove clues while the puzzle stays
// uniquely solvable. The grade is whatever the logical solver then needs, and attempts
// repeat (deterministically, from one seeded RNG) until the grade matches the request.
import { CELLS, countClues } from './grid';
import { countSolutions, randomSolvedGrid } from './counter';
import { DIFFICULTY_LEVEL, difficultyFromLevel, type Difficulty } from './grader';
import { solveLogically } from './solver';
import { mulberry32, shuffle, type Rng } from './rng';
import type { Level } from './steps';

export interface Generated {
  readonly puzzle: number[];
  readonly solution: number[];
  readonly difficulty: Difficulty;
  readonly clues: number;
  readonly attempts: number;
}

/** Stop removing clues at this count, so easier puzzles keep a friendly number of givens. */
const CLUE_FLOOR: Readonly<Record<Difficulty, number>> = { easy: 36, medium: 28, hard: 0, expert: 0 };
/** X-wing-only puzzles are rare (about 1 attempt in 200), so the default cap is generous. */
export const DEFAULT_MAX_ATTEMPTS = 4000;

/**
 * Remove clues in random order while the puzzle stays solvable with techniques of level
 * <= limit. A full logical solve proves uniqueness (every technique is sound), so the
 * explicit solution counter is only used for the unrestricted (expert) pass.
 */
function carve(solution: readonly number[], target: Difficulty, rng: Rng): number[] {
  const puzzle = [...solution];
  const limit = DIFFICULTY_LEVEL[target];
  let clues = CELLS;
  for (const cell of shuffle(Array.from({ length: CELLS }, (_, i) => i), rng)) {
    if (clues <= CLUE_FLOOR[target]) break;
    const saved = puzzle[cell] as number;
    puzzle[cell] = 0;
    const ok = limit < 4 ? solveLogically(puzzle, limit as Level).solved : countSolutions(puzzle, 2) === 1;
    if (ok) clues--;
    else puzzle[cell] = saved;
  }
  return puzzle;
}

export function gradeLevel(puzzle: readonly number[]): Difficulty {
  const res = solveLogically(puzzle);
  return difficultyFromLevel(res.maxLevel, res.solved);
}

export interface GenerateOptions {
  readonly maxAttempts?: number;
}

/** Deterministic for a given (difficulty, seed). Falls back to the closest grade if capped. */
export function generatePuzzle(difficulty: Difficulty, seed: number, opts: GenerateOptions = {}): Generated {
  const rng = mulberry32(seed);
  const cap = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const want = DIFFICULTY_LEVEL[difficulty];
  let best: Generated | null = null;
  let bestDist = Infinity;
  for (let attempt = 1; attempt <= cap; attempt++) {
    const solution = randomSolvedGrid(rng);
    const puzzle = carve(solution, difficulty, rng);
    const actual = gradeLevel(puzzle);
    const candidate: Generated = { puzzle, solution, difficulty: actual, clues: countClues(puzzle), attempts: attempt };
    if (actual === difficulty) return candidate;
    const dist = Math.abs(DIFFICULTY_LEVEL[actual] - want);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best as Generated;
}
