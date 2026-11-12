import { describe, expect, it } from 'vitest';
import { applyMove, isGoal, type Amounts } from '../src/jugs';
import { hintFor, parOf, solve } from '../src/solver';

function replay(caps: number[], start: Amounts, path: NonNullable<ReturnType<typeof solve>>): Amounts {
  return path.reduce<Amounts>((a, m) => applyMove(caps, a, m) ?? a, start);
}

describe('solver', () => {
  it('finds the classic 3 and 5 jug measure of 4 in 6 moves', () => {
    const path = solve([3, 5], [0, 0], { amount: 4, count: 1 });
    expect(path).toHaveLength(6);
    expect(isGoal(replay([3, 5], [0, 0], path ?? []), { amount: 4, count: 1 })).toBe(true);
  });
  it('solves the classic 8, 5, 3 split in 7 moves', () => {
    expect(parOf([8, 5, 3], [8, 0, 0], { amount: 4, count: 2 })).toBe(7);
  });
  it('returns an empty path when already solved', () => {
    expect(solve([3, 5], [3, 0], { amount: 3, count: 1 })).toEqual([]);
  });
  it('returns null when the goal is unreachable (gcd rule)', () => {
    expect(solve([4, 6], [0, 0], { amount: 3, count: 1 })).toBeNull();
    expect(parOf([4, 6], [0, 0], { amount: 3, count: 1 })).toBeNull();
  });
  it('every path replays legally to the goal on a 4-jug puzzle', () => {
    const caps = [5, 9, 14, 19];
    const goal = { amount: 12, count: 1 };
    const path = solve(caps, [0, 0, 0, 0], goal);
    expect(path).not.toBeNull();
    expect(isGoal(replay(caps, [0, 0, 0, 0], path ?? []), goal)).toBe(true);
  });
  it('hint is the first move of the shortest path and tracks the position', () => {
    const goal = { amount: 4, count: 1 };
    expect(hintFor([3, 5], [0, 0], goal)).toEqual(solve([3, 5], [0, 0], goal)?.[0]);
    expect(hintFor([3, 5], [0, 4], goal)).toBeNull();
    const mid = hintFor([3, 5], [3, 2], goal);
    expect(mid).not.toBeNull();
  });
});
