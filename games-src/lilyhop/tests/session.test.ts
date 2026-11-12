import { describe, expect, it } from 'vitest';
import { lineSpec } from '../src/levels';
import { Session } from '../src/session';

const spec = lineSpec('s2', 2, 1); // AA.BB, optimal 8

describe('Session', () => {
  it('starts idle and counts moves', () => {
    const s = new Session(spec);
    expect(s.status).toBe('idle');
    expect(s.optimal).toBe(8);
    const r = s.play({ from: 1, to: 2, over: -1 });
    expect(r.ok).toBe(true);
    expect(s.moves).toBe(1);
    expect(s.status).toBe('playing');
  });
  it('rejects illegal moves without changing state', () => {
    const s = new Session(spec);
    expect(s.play({ from: 0, to: 2, over: 1 }).ok).toBe(false);
    expect(s.moves).toBe(0);
  });
  it('undo restores the previous board and counts the undo', () => {
    const s = new Session(spec);
    s.play({ from: 1, to: 2, over: -1 });
    expect(s.undo()).toBeDefined();
    expect(s.state).toBe(spec.start);
    expect(s.undos).toBe(1);
    expect(s.undo()).toBeUndefined();
  });
  it('plays the optimal solution to a 3 star win', () => {
    const s = new Session(spec);
    while (s.status !== 'won') {
      const m = s.hint()!;
      s.play(m);
    }
    expect(s.moves).toBe(8);
    expect(s.hints).toBe(8);
    expect(s.stars).toBe(2); // hints cap the result
  });
  it('wins with 3 stars when no hint is used', () => {
    const s = new Session(spec);
    while (s.status !== 'won') s.play(s.solver.bestMove(s.state)!);
    expect(s.stars).toBe(3);
    expect(s.movesOf(0)).toEqual([]);
  });
  it('flags a stuck position and recovers via undo', () => {
    const s = new Session(spec);
    // Find any move that leads to an unsolvable state by exploring.
    let found = false;
    const walk = (depth: number): void => {
      if (found || depth > 6) return;
      for (let i = 0; i < s.state.length && !found; i++) {
        for (const m of s.movesOf(i)) {
          s.play(m);
          if (s.status === 'stuck') { found = true; return; }
          walk(depth + 1);
          if (found) return;
          s.undo();
        }
      }
    };
    walk(0);
    expect(found).toBe(true);
    expect(s.status).toBe('stuck');
    s.undo();
    expect(s.status).not.toBe('stuck');
  });
  it('restart resets everything', () => {
    const s = new Session(spec);
    s.play({ from: 1, to: 2, over: -1 });
    s.hint();
    s.restart();
    expect([s.moves, s.undos, s.hints, s.state]).toEqual([0, 0, 0, spec.start]);
  });
});
