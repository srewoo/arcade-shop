import { describe, expect, it } from 'vitest';
import { boardFromRows, discCount, hasMoves, makeBoard } from '../src/board';
import { CONFIG } from '../src/config';
import { groupAt, isWin, movesLeft, newGame, play, undo, type GameState } from '../src/game';

const withBoard = (s: GameState, board: GameState['board'], extra: Partial<GameState> = {}): GameState => ({ ...s, board, ...extra });

describe('newGame', () => {
  it('is deterministic per seed and mode', () => {
    expect(newGame('classic', 5).board).toEqual(newGame('classic', 5).board);
    expect(newGame('endless', 5).board).toEqual(newGame('endless', 5).board);
  });
  it('endless starts partially filled with a legal move and a rise countdown', () => {
    const s = newGame('endless', 8);
    expect(hasMoves(s.board)).toBe(true);
    expect(s.board.cols.filter((c) => c.length > 0)).toHaveLength(CONFIG.modes.endless.startCols);
    expect(s.riseIn).toBe(CONFIG.modes.endless.risePeriod);
  });
  it('moves mode gets a limit and an achievable target below the solver best', () => {
    const s = newGame('moves', 4);
    expect(s.moveLimit).toBe(CONFIG.modes.moves.moveLimit);
    expect(s.target).toBeGreaterThanOrEqual(10);
    expect(movesLeft(s)).toBe(s.moveLimit);
  });
});

describe('play', () => {
  const base = newGame('classic', 1);
  it('ignores cells without a group', () => {
    const lone = withBoard(base, boardFromRows(['01', '10'], 9));
    expect(play(lone, 0, 0)).toBeNull();
  });
  it('scores (n-2)^2 and counts the move', () => {
    const s = withBoard(base, boardFromRows(['001', '101'], 9));
    const r = play(s, 0, 1);
    expect(r?.points).toBe(1);
    expect(r?.state.score).toBe(1);
    expect(r?.state.moves).toBe(1);
  });
  it('awards the clear bonus and ends as cleared', () => {
    const s = withBoard(base, boardFromRows(['00'], 9));
    const r = play(s, 0, 0)!;
    expect(r.bonus).toBe(CONFIG.scoring.clearBonus);
    expect(r.state.status).toBe('finished');
    expect(r.state.end).toBe('cleared');
    expect(isWin(r.state)).toBe(true);
    expect(play(r.state, 0, 0)).toBeNull();
  });
  it('ends as stuck when no groups remain', () => {
    const s = withBoard(base, boardFromRows(['001', '010'], 9));
    const r = play(s, 0, 1)!;
    expect(r.state.end).toBe('stuck');
    expect(isWin(r.state)).toBe(false);
  });
});

describe('undo', () => {
  it('restores the previous position once', () => {
    const s = newGame('classic', 2);
    const g = s.board.cols.flatMap((c, x) => c.map((_, y) => ({ x, y }))).find((p) => groupAt(s, p.x, p.y).length > 0)!;
    const r = play(s, g.x, g.y)!;
    const back = undo(r.state)!;
    expect(back.board).toEqual(s.board);
    expect(back.score).toBe(0);
    expect(back.moves).toBe(0);
    expect(undo(back)).toBeNull();
  });
});

describe('moves mode', () => {
  const s0 = newGame('moves', 3);
  it('finishes when moves run out: target reached is a win, short is a loss', () => {
    const board = boardFromRows(['0000', '1111'], 9);
    const hit = play(withBoard(s0, board, { moves: s0.moveLimit - 1, target: 4 }), 0, 1)!;
    expect(hit.state.end).toBe('target');
    const miss = play(withBoard(s0, board, { moves: s0.moveLimit - 1, target: 400 }), 0, 1)!;
    expect(miss.state.end).toBe('short');
    expect(isWin(miss.state)).toBe(false);
  });
});

describe('endless mode', () => {
  const s0 = newGame('endless', 6);
  const pairs = boardFromRows(['0123', '0123'], 9);
  it('counts down and raises a new column on schedule', () => {
    let s = withBoard(s0, pairs, { riseIn: 2 });
    const first = play(s, 0, 0)!;
    expect(first.rises).toHaveLength(0);
    expect(first.state.riseIn).toBe(1);
    s = first.state;
    const second = play(s, 0, 0)!;
    expect(second.rises).toHaveLength(1);
    expect(second.state.riseIn).toBe(CONFIG.modes.endless.risePeriod);
    expect(discCount(second.state.board)).toBe(4 + second.rises[0]!.colours.length);
  });
  it('forces a rise when no move is left, and keeps rising until one exists', () => {
    const s = withBoard(s0, boardFromRows(['001', '010'], 9), { riseIn: 3 });
    const r = play(s, 0, 1)!;
    expect(r.rises.length).toBeGreaterThanOrEqual(1);
    expect(hasMoves(r.state.board) || r.state.status === 'finished').toBe(true);
  });
  it('ends with overflow when a column must rise on a full board', () => {
    const cols = Array.from({ length: CONFIG.board.cols }, (_, i) => (i === 0 ? [0, 0, 1] : [1, 0, 1, 0]));
    const s = withBoard(s0, makeBoard(cols, CONFIG.board.cols, CONFIG.board.rows), { riseIn: 1 });
    const r = play(s, 0, 0)!;
    expect(r.state.end).toBe('overflow');
    expect(r.state.status).toBe('finished');
  });
  it('undo restores the rng so the next rise is identical', () => {
    const s = withBoard(s0, pairs, { riseIn: 1 });
    const a = play(s, 0, 0)!;
    const b = play(undo(a.state)!, 0, 0)!;
    expect(b.rises).toEqual(a.rises);
  });
});
