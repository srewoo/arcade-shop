import { describe, expect, it } from 'vitest';
import { ALL, bit, createState, digitsOf, type SolverState } from '../src/core/candidates';
import { emptyGrid, parseGrid, ROWS } from '../src/core/grid';
import { findHiddenSingle, findNakedSingle } from '../src/core/singles';
import { findHiddenPair, findNakedPair } from '../src/core/subsets';
import { findClaiming, findPointing } from '../src/core/intersections';
import { findXWing } from '../src/core/xwing';
import { applyStep } from '../src/core/steps';
import { nextStep, solveLogically } from '../src/core/solver';
import { PUZZLE, SOLUTION, XWING } from './fixtures';

/** A blank board where every cell is a candidate for everything; tests then carve out a pattern. */
const blank = (): SolverState => createState(emptyGrid());
const drop = (s: SolverState, cell: number, ...digits: number[]): void => {
  for (const d of digits) s.cands[cell] = (s.cands[cell] ?? 0) & ~bit(d);
};
const only = (s: SolverState, cell: number, ...digits: number[]): void => {
  s.cands[cell] = digits.reduce((m, d) => m | bit(d), 0);
};

describe('singles', () => {
  it('finds a naked single and explains it', () => {
    const s = blank();
    only(s, 10, 7);
    const step = findNakedSingle(s);
    expect(step?.placement).toEqual({ cell: 10, digit: 7 });
    expect(step?.technique).toBe('naked-single');
    expect(step?.message).toContain('r2c2 can only be 7');
  });

  it('finds a hidden single in a row and says which row', () => {
    const s = blank();
    for (const c of ROWS[2]!.cells) if (c !== 22) drop(s, c, 5);
    const step = findHiddenSingle(s);
    expect(step?.placement).toEqual({ cell: 22, digit: 5 });
    expect(step?.message).toMatch(/Only 5 fits in r3c5 for row 3/);
    expect(step?.region).toEqual([...ROWS[2]!.cells]);
  });

  it('reports no single on a blank board', () => {
    expect(findNakedSingle(blank())).toBeNull();
    expect(findHiddenSingle(blank())).toBeNull();
  });

  it('solves the classic example with singles only', () => {
    const res = solveLogically(parseGrid(PUZZLE) as number[], 1);
    expect(res.solved).toBe(true);
    expect(res.grid.join('')).toBe(SOLUTION);
    expect(res.maxLevel).toBe(1);
  });
});

describe('subsets', () => {
  it('naked pair removes both digits from the rest of the row', () => {
    const s = blank();
    only(s, 0, 1, 2);
    only(s, 1, 1, 2);
    const step = findNakedPair(s);
    expect(step?.technique).toBe('naked-pair');
    expect(step?.focus).toEqual([0, 1]);
    const hit = step?.eliminations.filter((e) => e.cell === 5).map((e) => e.digit);
    expect(hit).toEqual([1, 2]);
    expect(step?.eliminations.some((e) => e.cell === 0 || e.cell === 1)).toBe(false);
  });

  it('hidden pair strips other candidates from its two cells', () => {
    const s = blank();
    for (const c of ROWS[0]!.cells) if (c !== 0 && c !== 4) drop(s, c, 3, 8);
    const step = findHiddenPair(s);
    expect(step?.technique).toBe('hidden-pair');
    expect(step?.focus).toEqual([0, 4]);
    const left = new Set(step?.eliminations.map((e) => e.digit));
    expect(left.has(3) || left.has(8)).toBe(false);
    expect(step?.eliminations.filter((e) => e.cell === 0)).toHaveLength(7);
  });

  it('does nothing when a pair has nothing to remove', () => {
    const s = blank();
    only(s, 0, 1, 2);
    only(s, 1, 1, 2);
    for (let c = 2; c < 81; c++) drop(s, c, 1, 2);
    expect(findNakedPair(s)).toBeNull();
  });
});

describe('intersections', () => {
  it('pointing pair: box candidates on one row clear the rest of the row', () => {
    const s = blank();
    for (const c of [2, 9, 10, 11, 18, 19, 20]) drop(s, c, 4);
    const step = findPointing(s);
    expect(step?.technique).toBe('pointing');
    expect(step?.focus).toEqual([0, 1]);
    expect(step?.eliminations.map((e) => e.cell)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(step?.eliminations.every((e) => e.digit === 4)).toBe(true);
  });

  it('claiming: row candidates inside one box clear the rest of the box', () => {
    const s = blank();
    for (let c = 3; c < 9; c++) drop(s, c, 4);
    const step = findClaiming(s);
    expect(step?.technique).toBe('claiming');
    expect(step?.focus).toEqual([0, 1, 2]);
    expect(step?.eliminations.map((e) => e.cell)).toEqual([9, 10, 11, 18, 19, 20]);
  });
});

describe('x-wing', () => {
  it('removes the digit from the other rows of the two columns', () => {
    const s = blank();
    for (const row of [1, 5]) {
      for (let col = 0; col < 9; col++) if (col !== 2 && col !== 6) drop(s, row * 9 + col, 7);
    }
    const step = findXWing(s);
    expect(step?.technique).toBe('x-wing');
    expect(step?.level).toBe(3);
    expect([...(step?.focus ?? [])].sort((a, b) => a - b)).toEqual([11, 15, 47, 51]);
    expect(step?.eliminations).toHaveLength(14);
    expect(step?.eliminations.every((e) => e.digit === 7 && (e.cell % 9 === 2 || e.cell % 9 === 6))).toBe(true);
    expect(step?.message).toContain('X-wing on 7');
  });

  it('is needed by the sudokuwiki example, after singles run dry', () => {
    const res = solveLogically(parseGrid(XWING) as number[], 3, true);
    expect(res.solved).toBe(true);
    expect(res.maxLevel).toBe(3);
    expect(res.steps.some((st) => st.technique === 'x-wing')).toBe(true);
    expect(solveLogically(parseGrid(XWING) as number[], 2).solved).toBe(false);
  });
});

describe('solver stepping', () => {
  it('applies steps and keeps candidates consistent', () => {
    const s = createState(parseGrid(PUZZLE) as number[]);
    const step = nextStep(s);
    expect(step).not.toBeNull();
    if (step) applyStep(s, step);
    if (step?.placement) expect(s.grid[step.placement.cell]).toBe(step.placement.digit);
    expect(digitsOf(ALL)).toHaveLength(9);
  });
});
