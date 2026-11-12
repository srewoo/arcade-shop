import { describe, expect, it } from 'vitest';
import { countSolutions } from '../src/core/counter';
import { generatePuzzle } from '../src/core/generator';
import { DIFFICULTIES, grade } from '../src/core/grader';
import { isValidSolution } from '../src/core/grid';
import { solveLogically } from '../src/core/solver';
import { EXPERT, PUZZLE, SOLUTION } from './fixtures';
import { parseGrid } from '../src/core/grid';

const SEEDS = Array.from({ length: 10 }, (_, i) => 1000 + i * 7919);

describe('grader', () => {
  it('grades the classic example easy and the Inkala puzzle expert', () => {
    expect(grade(parseGrid(PUZZLE) as number[]).difficulty).toBe('easy');
    const g = grade(parseGrid(EXPERT) as number[]);
    expect(g.difficulty).toBe('expert');
    expect(g.needsGuessing).toBe(true);
    expect(g.unique).toBe(true);
    expect(solveLogically(parseGrid(SOLUTION) as number[]).maxLevel).toBe(0);
  });
});

describe('generator', () => {
  for (const difficulty of DIFFICULTIES) {
    it(
      `makes unique, correctly graded ${difficulty} puzzles for 10 seeds`,
      () => {
        for (const seed of SEEDS) {
          const g = generatePuzzle(difficulty, seed);
          expect(g.difficulty).toBe(difficulty);
          expect(isValidSolution(g.solution)).toBe(true);
          expect(countSolutions(g.puzzle, 2)).toBe(1);
          expect(g.puzzle.every((d, i) => d === 0 || d === g.solution[i])).toBe(true);
          expect(grade(g.puzzle).difficulty).toBe(difficulty);
        }
      },
      240_000,
    );
  }

  it('is deterministic for a seed (the daily puzzle relies on it)', () => {
    const a = generatePuzzle('medium', 20250101);
    const b = generatePuzzle('medium', 20250101);
    expect(a.puzzle).toEqual(b.puzzle);
    expect(generatePuzzle('medium', 20250102).puzzle).not.toEqual(a.puzzle);
  });

  it('generates easy, medium and expert puzzles quickly', () => {
    for (const difficulty of ['easy', 'medium', 'expert'] as const) {
      const t0 = performance.now();
      for (const seed of SEEDS) generatePuzzle(difficulty, seed);
      const avg = (performance.now() - t0) / SEEDS.length;
      expect(avg).toBeLessThan(300);
    }
  });
});
