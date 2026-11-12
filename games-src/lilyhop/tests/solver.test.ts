import { describe, expect, it } from 'vitest';
import { applyMove } from '../src/board';
import { LEVELS, lineSpec } from '../src/levels';
import { classicOptimal } from '../src/scoring';
import { buildSolver } from '../src/solver';

describe('solver and level validation', () => {
  it.each([2, 3, 4, 5])('classic %i + %i needs exactly n^2 + 2n moves', (n) => {
    expect(buildSolver(lineSpec('c', n, 1)).optimal).toBe(classicOptimal(n));
  });
  it('every shipped level is solvable and non-trivial', () => {
    for (const level of LEVELS) {
      const s = buildSolver(level.spec);
      expect(s.optimal, level.id).toBeGreaterThan(0);
      expect(level.spec.start).not.toBe(level.spec.goal);
      expect(level.spec.start).toHaveLength(level.spec.cols * level.spec.rows);
    }
  });
  it('level ids are unique', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
  });
  it('following bestMove reaches the goal in exactly optimal moves', () => {
    for (const level of LEVELS) {
      const s = buildSolver(level.spec);
      let state = level.spec.start;
      let steps = 0;
      while (state !== level.spec.goal && steps < 500) {
        const m = s.bestMove(state);
        expect(m, `${level.id} step ${steps}`).toBeDefined();
        state = applyMove(state, m!);
        steps++;
      }
      expect(steps).toBe(s.optimal);
    }
  });
  it('detects a dead position (two same-team pieces blocked by a wall of rivals)', () => {
    const s = buildSolver(lineSpec('c', 2, 1));
    // A A . B B -> A moves to .: AA.BB -> A.ABB is fine; AB.AB style states cannot happen. Force a stuck state:
    // after A steps, B jumps, A jumps ... walk to a state with no way out by exhaustive search.
    const dead = [...s.solvable()].length;
    expect(dead).toBeLessThan(s.stateCount);
    expect(s.distance('BBAA.')).toBeUndefined();
  });
  it('an extra gap makes the puzzle longer than the one-gap version', () => {
    expect(buildSolver(lineSpec('g', 3, 2)).optimal!).toBeGreaterThan(buildSolver(lineSpec('c', 3, 1)).optimal!);
  });
});
