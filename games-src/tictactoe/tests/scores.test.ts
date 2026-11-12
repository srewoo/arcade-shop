import { describe, expect, it } from 'vitest';
import { newGame, play, type GameState } from '../src/game';
import { recordResult } from '../src/results';
import { EMPTY_STATS, bumpScore, isMilestone, nextStats, parseScores, parseStats } from '../src/scores';

const playAll = (s: GameState, moves: number[]): GameState => moves.reduce(play, s);
const xWins = playAll(newGame('classic'), [0, 3, 1, 4, 2]);
const oWins = playAll(newGame('classic'), [0, 4, 1, 3, 8, 5]);
const draw = playAll(newGame('classic'), [0, 1, 2, 4, 3, 5, 7, 6, 8]);

describe('streak stats', () => {
  it('wins extend the streak and track the best', () => {
    let s = nextStats(EMPTY_STATS, 'win');
    s = nextStats(s, 'win');
    expect(s).toEqual({ streak: 2, best: 2 });
    s = nextStats(s, 'loss');
    expect(s).toEqual({ streak: 0, best: 2 });
  });

  it('draws leave the streak alone', () => {
    expect(nextStats({ streak: 4, best: 6 }, 'draw')).toEqual({ streak: 4, best: 6 });
  });

  it('flags milestones 3, 5 and 10 only', () => {
    expect([1, 2, 3, 4, 5, 9, 10, 11].filter(isMilestone)).toEqual([3, 5, 10]);
  });

  it('validates stored stats', () => {
    expect(parseStats({ streak: 2, best: 5 })).toEqual({ streak: 2, best: 5 });
    expect(parseStats({ streak: -1, best: 5 })).toEqual(EMPTY_STATS);
    expect(parseStats({ streak: 1, best: 1, x: 1 })).toEqual(EMPTY_STATS);
  });
});

describe('round results', () => {
  it('records a human win vs CPU, with streak and milestone at 3', () => {
    let stats = { streak: 2, best: 2 };
    const r = recordResult({ X: 0, O: 0, draw: 0 }, stats, xWins, 'cpu');
    stats = r.stats;
    expect(r.scores.X).toBe(1);
    expect(stats.streak).toBe(3);
    expect(r.milestone).toBe(3);
  });

  it('a CPU win resets the streak and adds to O', () => {
    const r = recordResult({ X: 1, O: 1, draw: 0 }, { streak: 4, best: 4 }, oWins, 'cpu');
    expect(r.scores.O).toBe(2);
    expect(r.stats).toEqual({ streak: 0, best: 4 });
    expect(r.milestone).toBeNull();
  });

  it('a draw bumps draws and keeps the streak', () => {
    const r = recordResult({ X: 0, O: 0, draw: 0 }, { streak: 2, best: 2 }, draw, 'cpu');
    expect(r.scores.draw).toBe(1);
    expect(r.stats.streak).toBe(2);
  });

  it('two-player games never touch the streak', () => {
    const r = recordResult({ X: 0, O: 0, draw: 0 }, { streak: 2, best: 2 }, oWins, 'human');
    expect(r.stats).toEqual({ streak: 2, best: 2 });
    expect(r.milestone).toBeNull();
  });

  it('bumpScore adds on top of the latest stored value (multi-tab merge)', () => {
    const latest = parseScores({ X: 7, O: 1, draw: 0 });
    expect(bumpScore(latest, 'X').X).toBe(8);
  });
});
