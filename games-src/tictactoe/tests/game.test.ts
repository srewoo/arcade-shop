import { describe, expect, it } from 'vitest';
import { VANISH_MOVE_CAP, findWin, legalMoves, newGame, nextToVanish, play, type GameState } from '../src/game';
import { roundStarter, statusText } from '../src/status';

const playAll = (s: GameState, moves: number[]): GameState => moves.reduce(play, s);

describe('classic rules', () => {
  it('alternates turns starting with the chosen player', () => {
    const s = play(newGame('classic', 'O'), 4);
    expect(s.board[4]).toBe('O');
    expect(s.turn).toBe('X');
  });

  it('detects a row win and stops accepting moves', () => {
    const s = playAll(newGame('classic'), [0, 3, 1, 4, 2]);
    expect(s.winner).toBe('X');
    expect(s.line).toEqual([0, 1, 2]);
    expect(legalMoves(s)).toEqual([]);
    expect(() => play(s, 8)).toThrow('game is over');
  });

  it('detects a draw on a full board', () => {
    const s = playAll(newGame('classic'), [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(s.winner).toBeNull();
    expect(s.draw).toBe(true);
  });

  it('rejects taken and out-of-range cells', () => {
    const s = play(newGame('classic'), 0);
    expect(() => play(s, 0)).toThrow('taken');
    expect(() => play(s, 9)).toThrow(RangeError);
    expect(() => play(s, 1.5)).toThrow(RangeError);
  });

  it('does not mutate the previous state', () => {
    const before = newGame('classic');
    play(before, 0);
    expect(before.board.every((c) => c === null)).toBe(true);
  });

  it('finds diagonal wins', () => {
    expect(findWin(['O', null, null, null, 'O', null, null, null, 'O'])?.line).toEqual([0, 4, 8]);
  });
});

describe('vanishing rules', () => {
  it('removes the oldest mark when placing a fourth', () => {
    let s = playAll(newGame('vanishing'), [0, 3, 1, 4, 6, 2]);
    expect(s.winner).toBeNull();
    expect(nextToVanish(s, 'X')).toBe(0);
    s = play(s, 8);
    expect(s.board[0]).toBeNull();
    expect(s.board[8]).toBe('X');
    expect(s.marks.X).toEqual([1, 6, 8]);
  });

  it('cannot win using the mark that vanishes on the same move', () => {
    // X holds 0,1 and 4; placing 2 removes 0 first, so 0-1-2 is not a win.
    const s = play(playAll(newGame('vanishing'), [0, 3, 1, 5, 4, 7]), 2);
    expect(s.winner).toBeNull();
  });

  it('keeps at most six marks on the board', () => {
    const s = playAll(newGame('vanishing'), [0, 1, 2, 4, 3, 5, 7, 6]);
    expect(s.board.filter((c) => c !== null)).toHaveLength(6);
    expect(s.draw).toBe(false);
  });

  it('declares a draw only when the move cap is reached', () => {
    const base = playAll(newGame('vanishing'), [0, 1]);
    const nearCap: GameState = { ...base, moves: VANISH_MOVE_CAP - 2 };
    expect(play(nearCap, 8).draw).toBe(false);
    expect(play(play(nearCap, 8), 5).draw).toBe(true);
  });
});

describe('status helpers', () => {
  it('alternates starters by round', () => {
    expect([0, 1, 2].map((r) => roundStarter('alternate', r))).toEqual(['X', 'O', 'X']);
    expect(roundStarter('O', 3)).toBe('O');
  });

  it('describes outcomes for each opponent type', () => {
    const won = playAll(newGame('classic'), [0, 3, 1, 4, 2]);
    expect(statusText(won, 'cpu')).toBe('You win!');
    expect(statusText(won, 'human')).toBe('Player X wins!');
    expect(statusText(newGame('classic', 'O'), 'cpu')).toBe('CPU is thinking…');
  });
});
