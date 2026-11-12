import { describe, expect, it } from 'vitest';
import { isGoal, validateShape } from '../src/jugs';
import { LEVELS } from '../src/levels';
import { solve } from '../src/solver';

describe('campaign levels', () => {
  it('has 30 or more levels with sequential ids and unique names', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(30);
    LEVELS.forEach((l, i) => expect(l.id).toBe(i + 1));
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length);
  });
  it('uses 2 to 4 jugs and covers all three counts', () => {
    const counts = new Set(LEVELS.map((l) => l.jugs.length));
    expect([...counts].sort()).toEqual([2, 3, 4]);
  });
  it('every level is well formed, solvable, and not already solved', () => {
    for (const l of LEVELS) {
      expect(validateShape(l.jugs, l.start, l.goal), l.name).toBeNull();
      expect(isGoal(l.start, l.goal), `${l.name} starts solved`).toBe(false);
      const path = solve(l.jugs, l.start, l.goal);
      expect(path, l.name).not.toBeNull();
      expect(l.par, l.name).toBe(path?.length);
      expect(l.par).toBeGreaterThanOrEqual(1);
    }
  });
  it('includes split-water levels, among them 19, 13 and 7', () => {
    const splits = LEVELS.filter((l) => l.goal.count === 2);
    expect(splits.length).toBeGreaterThanOrEqual(8);
    expect(splits.some((l) => l.jugs.join() === '19,13,7')).toBe(true);
    for (const l of splits) expect(l.start.reduce((a, b) => a + b, 0)).toBe(l.goal.amount * 2);
  });
  it('par ranges from trivial to long, and the tail is harder than the head', () => {
    const pars = LEVELS.map((l) => l.par);
    expect(Math.min(...pars)).toBeLessThanOrEqual(2);
    expect(Math.max(...pars)).toBeGreaterThanOrEqual(12);
    const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(pars.slice(-10))).toBeGreaterThan(avg(pars.slice(0, 5)));
  });
  it('pins par for a few known levels (regression)', () => {
    const par = (i: number): number => LEVELS[i - 1]?.par ?? -1;
    expect([par(1), par(16), par(17), par(19), par(21)]).toEqual([1, 7, 9, 8, 14]);
  });
});
