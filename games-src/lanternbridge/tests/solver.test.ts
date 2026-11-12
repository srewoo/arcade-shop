import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, BRIDGE_LEVELS, RAFT_LEVELS } from '../src/levels';
import { initialState } from '../src/puzzle/engine';
import { checkSolution, solve } from '../src/puzzle/solver';
import { buildBridge } from '../src/levels/build';
import { classic } from './helpers';

describe('solver', () => {
  it('finds the classic 17-minute answer', () => {
    const sol = solve(classic());
    expect(sol?.cost).toBe(17);
    expect(sol?.path).toHaveLength(5);
  });

  it('three travellers cost the sum of all (fastest escorts)', () => {
    expect(buildBridge({ id: 't', title: '', blurb: '', times: [1, 2, 5], slack: 0 }).par).toBe(8);
  });

  it('matches a hand-checked case where the two slowest cross together', () => {
    // 2,3,8,9 -> 2+3 | 2 back | 8+9 | 3 back | 2+3 = 3+2+9+3+3 = 20 (escorting costs 24)
    expect(buildBridge({ id: 't', title: '', blurb: '', times: [2, 3, 8, 9], slack: 0 }).par).toBe(20);
  });

  it('solves from a mid-game state', () => {
    const level = classic();
    const first = solve(level);
    expect(first).not.toBeNull();
    const rest = solve(level, { ...initialState(level), start: 0b1100, carrierAtStart: false, cost: 2, moves: 1 });
    expect(rest?.cost).toBe(15);
  });

  it('returns null when a position cannot be solved (no lantern, nobody across)', () => {
    const level = classic();
    expect(solve(level, { start: 0b1111, carrierAtStart: false, cost: 0, moves: 0 })).toBeNull();
  });
});

describe('level validation', () => {
  it('every level is solvable and par matches the solver', () => {
    for (const level of ALL_LEVELS) {
      const sol = solve(level);
      expect(sol, level.id).not.toBeNull();
      expect(sol?.cost, level.id).toBe(level.par);
      expect(checkSolution(level, sol?.path ?? []).optimal, level.id).toBe(true);
    }
  });

  it('level ids are unique', () => {
    expect(new Set(ALL_LEVELS.map((l) => l.id)).size).toBe(ALL_LEVELS.length);
  });

  it('bridge pack covers 3 to 7 travellers with a limit at or above par', () => {
    const sizes = new Set(BRIDGE_LEVELS.map((l) => l.actors.length));
    expect([...sizes].sort()).toEqual([3, 4, 5, 6, 7]);
    for (const l of BRIDGE_LEVELS) {
      expect(l.limit, l.id).toBeGreaterThanOrEqual(l.par);
      const times = l.actors.map((a) => a.time);
      expect(times, l.id).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('bridge pack has varied times and some zero-slack levels', () => {
    expect(BRIDGE_LEVELS.length).toBeGreaterThanOrEqual(20);
    expect(BRIDGE_LEVELS.filter((l) => l.limit === l.par).length).toBeGreaterThanOrEqual(3);
  });

  it('raft pack has at least six levels with rules, and a rower in each', () => {
    expect(RAFT_LEVELS.length).toBeGreaterThanOrEqual(6);
    for (const l of RAFT_LEVELS) {
      expect(l.rules.length, l.id).toBeGreaterThan(0);
      expect(l.actors.some((a) => a.canRow), l.id).toBe(true);
    }
  });

  it('known raft pars: fox/hen/grain takes 7 crossings, keepers and magpies 11', () => {
    expect(RAFT_LEVELS[0]?.par).toBe(7);
    expect(RAFT_LEVELS[1]?.par).toBe(11);
  });
});

describe('checkSolution', () => {
  const level = classic(3);

  it('accepts the optimal route and flags it optimal', () => {
    const v = checkSolution(level, [[0, 1], [0], [2, 3], [1], [0, 1]]);
    expect(v).toMatchObject({ valid: true, solved: true, cost: 17, withinLimit: true, optimal: true });
  });

  it('accepts a slower route that is still within the limit but not optimal', () => {
    const v = checkSolution(level, [[0, 3], [0], [0, 2], [0], [0, 1]]);
    expect(v).toMatchObject({ valid: true, solved: true, cost: 19, withinLimit: true, optimal: false });
  });

  it('flags routes past the limit', () => {
    const v = checkSolution(level, [[0, 3], [3], [2, 3], [2], [1, 3], [1], [0, 1]]);
    expect(v.withinLimit).toBe(false);
  });

  it('rejects an illegal move and an incomplete route', () => {
    expect(checkSolution(level, [[0, 1], [2]]).valid).toBe(false);
    expect(checkSolution(level, [[0, 1]])).toMatchObject({ valid: true, solved: false });
  });
});
