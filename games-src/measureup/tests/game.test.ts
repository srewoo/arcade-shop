import { describe, expect, it } from 'vitest';
import { moveCount, newGame, play, restart, undo, useHint } from '../src/game';
import { LEVELS } from '../src/levels';
import { starsFor } from '../src/scoring';
import { solve } from '../src/solver';

const level = LEVELS[0]!; // jugs 3 and 5, hold 3

describe('game state', () => {
  it('counts moves, ignores illegal ones, and detects the win', () => {
    let g = newGame(level);
    expect(play(g, { kind: 'empty', jug: 0 })).toBe(g);
    g = play(g, { kind: 'fill', jug: 0 });
    expect(moveCount(g)).toBe(1);
    expect(g.solved).toBe(true);
    expect(play(g, { kind: 'empty', jug: 0 })).toBe(g);
  });
  it('undo restores the previous position and the move count', () => {
    let g = newGame(LEVELS[2]!);
    g = play(g, { kind: 'fill', jug: 1 });
    g = play(g, { kind: 'pour', from: 1, to: 0 });
    const back = undo(g);
    expect(moveCount(back)).toBe(1);
    expect(back.amounts).toEqual([0, 8]);
    expect(undo(newGame(level)).history).toHaveLength(0);
  });
  it('undo is disabled once solved', () => {
    const g = play(newGame(level), { kind: 'fill', jug: 0 });
    expect(undo(g)).toBe(g);
  });
  it('restart returns to the start and clears hints', () => {
    const l = LEVELS[1]!;
    const h = useHint(newGame(l));
    const g = restart(play(h.state, { kind: 'fill', jug: 0 }));
    expect(g.amounts).toEqual(l.start);
    expect(g.hintsUsed).toBe(0);
  });
  it('following hints from the start solves in exactly par moves', () => {
    for (const l of [LEVELS[3]!, LEVELS[17]!, LEVELS[24]!]) {
      let g = newGame(l);
      for (let i = 0; i < 40 && !g.solved; i++) {
        const { state, move } = useHint(g);
        expect(move).not.toBeNull();
        g = play(state, move!);
      }
      expect(g.solved).toBe(true);
      expect(moveCount(g)).toBe(l.par);
      expect(g.hintsUsed).toBe(l.par);
    }
  });
  it('a hint after a detour still reaches the goal', () => {
    const l = LEVELS[3]!;
    let g = play(newGame(l), { kind: 'fill', jug: 1 });
    g = play(g, { kind: 'empty', jug: 1 });
    expect(solve(l.jugs, g.amounts, l.goal)?.length).toBe(l.par);
  });
  it('no hint is given on a solved level', () => {
    const g = play(newGame(level), { kind: 'fill', jug: 0 });
    expect(useHint(g).move).toBeNull();
  });
});

describe('stars', () => {
  it('3 at par or better, 2 within slack, 1 beyond', () => {
    expect(starsFor(6, 6, 0)).toBe(3);
    expect(starsFor(5, 6, 0)).toBe(3);
    expect(starsFor(7, 6, 0)).toBe(2);
    expect(starsFor(9, 6, 0)).toBe(2);
    expect(starsFor(10, 6, 0)).toBe(1);
  });
  it('slack grows with par', () => {
    expect(starsFor(1 + 2, 1, 0)).toBe(2);
    expect(starsFor(1 + 3, 1, 0)).toBe(1);
    expect(starsFor(20 + 10, 20, 0)).toBe(2);
    expect(starsFor(20 + 11, 20, 0)).toBe(1);
  });
  it('hints cap the result at two stars but never below the earned stars', () => {
    expect(starsFor(6, 6, 1)).toBe(2);
    expect(starsFor(7, 6, 2)).toBe(2);
    expect(starsFor(30, 6, 2)).toBe(1);
  });
});
