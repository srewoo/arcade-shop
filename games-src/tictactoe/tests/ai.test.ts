import { describe, expect, it } from 'vitest';
import { bestMove, chooseMove, winningMove, type Level } from '../src/ai';
import { isOver, legalMoves, newGame, play, type GameState, type Player } from '../src/game';
import { parseScores } from '../src/scores';
import { parseSettings, DEFAULT_SETTINGS } from '../src/settings';

const playAll = (s: GameState, moves: number[]): GameState => moves.reduce(play, s);

/** Every possible line of play by `opponent` against the unbeatable CPU. */
function worstOutcome(s: GameState, cpu: Player): 'loss' | 'ok' {
  if (isOver(s)) return s.winner && s.winner !== cpu ? 'loss' : 'ok';
  if (s.turn === cpu) return worstOutcome(play(s, bestMove(s)), cpu);
  return legalMoves(s).some((m) => worstOutcome(play(s, m), cpu) === 'loss') ? 'loss' : 'ok';
}

describe('unbeatable CPU (classic)', () => {
  it('never loses as second player against any sequence', () => {
    expect(worstOutcome(newGame('classic', 'X'), 'O')).toBe('ok');
  });

  it('never loses as first player against any sequence', () => {
    expect(worstOutcome(newGame('classic', 'O'), 'O')).toBe('ok');
  });

  it('takes an immediate win over a block', () => {
    // O to move with 3-4 open on row 2 (3,4 are O) and X threatening 0-1-2.
    const s = playAll(newGame('classic', 'X'), [0, 3, 1, 4, 8]);
    expect(bestMove(s)).toBe(5);
  });
});

describe('vanishing CPU', () => {
  it('blocks an immediate threat', () => {
    const s = playAll(newGame('vanishing', 'X'), [0, 4, 1]);
    expect(bestMove(s)).toBe(2);
  });

  it('answers quickly from an open position', () => {
    const start = performance.now();
    bestMove(newGame('vanishing', 'O'));
    expect(performance.now() - start).toBeLessThan(1500);
  });
});

describe('levels', () => {
  const seq = (values: number[]) => () => values.shift() ?? 0;

  it('medium always wins or blocks when it can', () => {
    const s = playAll(newGame('classic', 'X'), [0, 4, 1]);
    expect(winningMove(s, 'X')).toBe(2);
    expect(chooseMove(s, 'medium', seq([0.99]))).toBe(2);
  });

  it('every level returns a legal move', () => {
    const s = playAll(newGame('classic', 'X'), [4, 0, 8]);
    for (const level of ['easy', 'medium', 'hard'] as Level[]) {
      expect(legalMoves(s)).toContain(chooseMove(s, level, seq([0.3, 0.7])));
    }
  });
});

describe('settings parsing', () => {
  it('keeps valid fields and defaults invalid ones', () => {
    const parsed = parseSettings({ opponent: 'human', level: 'godlike', sound: 'yes', extra: 1 });
    expect(parsed).toEqual({ ...DEFAULT_SETTINGS, opponent: 'human' });
  });

  it('falls back to defaults on garbage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
  });

  it('rejects malformed scores', () => {
    expect(parseScores({ X: 2, O: 1, draw: 0 })).toEqual({ X: 2, O: 1, draw: 0 });
    expect(parseScores({ X: -1, O: 1, draw: 0 })).toEqual({ X: 0, O: 0, draw: 0 });
    expect(parseScores({ X: 1, O: 1, draw: 0, hack: 1 })).toEqual({ X: 0, O: 0, draw: 0 });
  });
});
