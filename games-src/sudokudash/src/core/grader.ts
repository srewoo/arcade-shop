// Difficulty grading by the hardest human technique the logical solver needs.
import { countSolutions } from './counter';
import { countClues } from './grid';
import { solveLogically } from './solver';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
export const DIFFICULTY_LEVEL: Readonly<Record<Difficulty, number>> = { easy: 1, medium: 2, hard: 3, expert: 4 };

export interface Grade {
  readonly difficulty: Difficulty;
  readonly unique: boolean;
  readonly clues: number;
  /** True when no technique set could finish the puzzle (backtracking needed). */
  readonly needsGuessing: boolean;
}

export function difficultyFromLevel(level: number, solvedLogically: boolean): Difficulty {
  if (!solvedLogically) return 'expert';
  if (level <= 1) return 'easy';
  if (level === 2) return 'medium';
  return 'hard';
}

export function grade(puzzle: readonly number[]): Grade {
  const unique = countSolutions(puzzle, 2) === 1;
  const res = solveLogically(puzzle);
  return {
    difficulty: difficultyFromLevel(res.maxLevel, res.solved),
    unique,
    clues: countClues(puzzle),
    needsGuessing: !res.solved,
  };
}
