import { describe, expect, it } from 'vitest';
import { countSolutions, randomSolvedGrid, solveBacktracking } from '../src/core/counter';
import { emptyGrid, isValidSolution, parseGrid } from '../src/core/grid';
import { mulberry32 } from '../src/core/rng';
import { EXPERT, EXPERT_SOLUTION, PUZZLE, SOLUTION } from './fixtures';

describe('solution counter', () => {
  it('counts exactly one solution for a proper puzzle', () => {
    expect(countSolutions(parseGrid(PUZZLE) as number[])).toBe(1);
    expect(solveBacktracking(parseGrid(PUZZLE) as number[])?.join('')).toBe(SOLUTION);
  });

  it('stops at the limit (an empty grid has astronomically many solutions)', () => {
    expect(countSolutions(emptyGrid(), 2)).toBe(2);
    expect(countSolutions(emptyGrid(), 5)).toBe(5);
  });

  it('returns 0 for contradictory grids', () => {
    const g = parseGrid(PUZZLE) as number[];
    g[2] = 5; // 5 already in row 1
    expect(countSolutions(g)).toBe(0);
    const stuck = parseGrid(PUZZLE) as number[];
    stuck[2] = 1; // legal looking, but kills the grid somewhere
    expect(countSolutions(stuck)).toBe(0);
  });

  it('detects a puzzle with several solutions', () => {
    const sol = parseGrid(SOLUTION) as number[];
    const loose = sol.map((d) => (d === 1 || d === 2 ? 0 : d));
    expect(countSolutions(loose, 2)).toBe(2);
  });

  it('solves the known expert puzzle by backtracking', () => {
    const solved = solveBacktracking(parseGrid(EXPERT) as number[]);
    expect(solved?.join('')).toBe(EXPERT_SOLUTION);
    expect(countSolutions(parseGrid(EXPERT) as number[], 2)).toBe(1);
  });

  it('builds valid random full grids, reproducibly', () => {
    const a = randomSolvedGrid(mulberry32(42));
    const b = randomSolvedGrid(mulberry32(42));
    expect(isValidSolution(a)).toBe(true);
    expect(a).toEqual(b);
    expect(randomSolvedGrid(mulberry32(43))).not.toEqual(a);
  });
});
