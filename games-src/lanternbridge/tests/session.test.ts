import { describe, expect, it } from 'vitest';
import { createSession } from '../src/session';
import { RAFT_LEVELS } from '../src/levels';
import { solve } from '../src/puzzle/solver';
import { rate, isDeadEnd } from '../src/puzzle/stars';
import { initialState } from '../src/puzzle/engine';
import { classic } from './helpers';

const play = (s: ReturnType<typeof createSession>, group: number[]): void => {
  for (const i of group) s.toggle(i);
  s.cross();
};

describe('session', () => {
  it('toggles selection up to capacity and refuses the far bank', () => {
    const s = createSession(classic(2));
    expect(s.toggle(0)).toBe('selected');
    expect(s.toggle(1)).toBe('selected');
    expect(s.toggle(2)).toBe('full');
    expect(s.toggle(1)).toBe('deselected');
    s.toggle(1);
    s.cross();
    expect(s.toggle(2)).toBe('wrong-side');
  });

  it('cross with nothing selected fails without changing state', () => {
    const s = createSession(classic(2));
    expect(s.cross()).toEqual({ ok: false, reason: 'empty' });
    expect(s.state().moves).toBe(0);
  });

  it('wins on the optimal route with 3 stars', () => {
    const s = createSession(classic(2));
    for (const g of [[0, 1], [0], [2, 3], [1], [0, 1]]) play(s, g);
    expect(s.outcome()).toBe('won');
    expect(s.stars()).toBe(3);
  });

  it('loses when the oil runs out, and undo recovers', () => {
    const s = createSession(classic(0));
    play(s, [0, 3]);
    expect(s.outcome()).toBe('playing');
    play(s, [3]);
    expect(s.outcome()).toBe('lost');
    expect(s.toggle(0)).toBe('locked');
    expect(s.undo()).toBe(true);
    expect(s.outcome()).toBe('playing');
  });

  it('detects a dead end before the limit is actually passed', () => {
    const s = createSession(classic(0));
    play(s, [0, 3]); // 10 minutes spent; best finish is now 10 + 1 + 5 + 2 + 2 = beyond 17
    expect(s.stuck()).toBe(true);
  });

  it('undo returns to the previous state and clears selection', () => {
    const s = createSession(classic(2));
    play(s, [0, 1]);
    s.toggle(0);
    expect(s.undo()).toBe(true);
    expect(s.state().moves).toBe(0);
    expect(s.selected()).toEqual([]);
    expect(s.undo()).toBe(false);
  });

  it('restart resets state and hints', () => {
    const s = createSession(classic(2));
    s.hint();
    play(s, [0, 1]);
    s.restart();
    expect(s.state()).toEqual(initialState(s.level));
    expect(s.hintsUsed()).toBe(0);
    expect(s.log()).toEqual([]);
  });

  it('a hint selects the next optimal group, counts, and caps stars at 2', () => {
    const level = classic(2);
    const s = createSession(level);
    const g = s.hint();
    expect(g).toEqual(solve(level)?.path[0]);
    expect(s.selected()).toEqual(g);
    expect(s.hintsUsed()).toBe(1);
    s.restart();
    s.hint();
    s.cross();
    for (const grp of [[0], [2, 3], [1], [0, 1]]) play(s, grp);
    expect(s.outcome()).toBe('won');
    expect(s.stars()).toBe(2);
  });

  it('gives no hint once no route fits', () => {
    const s = createSession(classic(0));
    play(s, [0, 3]);
    expect(s.hint()).toBeNull();
  });

  it('raft: a rule-breaking crossing is refused and costs nothing', () => {
    const farm = RAFT_LEVELS[0];
    if (!farm) throw new Error('missing');
    const s = createSession(farm);
    s.toggle(0);
    s.toggle(3);
    const res = s.cross();
    expect(res).toMatchObject({ ok: false, reason: 'rule' });
    expect(s.state().moves).toBe(0);
  });

  it('raft: following the solver path wins in par crossings', () => {
    for (const level of RAFT_LEVELS) {
      const s = createSession(level);
      for (const g of solve(level)?.path ?? []) play(s, [...g]);
      expect(s.outcome(), level.id).toBe('won');
      expect(s.state().moves, level.id).toBe(level.par);
      expect(s.stars(), level.id).toBe(3);
    }
  });
});

describe('star rating', () => {
  const level = classic(4);
  it('3 at par, 2 within half the slack, 1 beyond', () => {
    expect(rate(level, 17, 0)).toBe(3);
    expect(rate(level, 19, 0)).toBe(2);
    expect(rate(level, 20, 0)).toBe(1);
    expect(rate(level, 21, 0)).toBe(1);
  });
  it('raft: par is 3 stars, par+2 is 2, more is 1', () => {
    const raft = RAFT_LEVELS[0];
    if (!raft) throw new Error('missing');
    expect(rate(raft, raft.par, 0)).toBe(3);
    expect(rate(raft, raft.par + 2, 0)).toBe(2);
    expect(rate(raft, raft.par + 3, 0)).toBe(1);
  });
  it('dead end only applies to limited levels', () => {
    expect(isDeadEnd(RAFT_LEVELS[0]!, initialState(RAFT_LEVELS[0]!))).toBe(false);
    expect(isDeadEnd(level, initialState(level))).toBe(false);
  });
});
