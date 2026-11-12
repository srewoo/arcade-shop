import { describe, expect, it } from 'vitest';
import { newGame, play, type GameState } from '../src/game';
import { gameOverText, moveCounter, resultBanner, shouldAutoPause, shouldOpenOptions } from '../src/status';
import { levelDescription, levelName, optionsSummary } from '../src/strings';
import { DEFAULT_SETTINGS } from '../src/settings';

const playAll = (s: GameState, moves: number[]): GameState => moves.reduce(play, s);

describe('move counter', () => {
  it('is hidden in Classic', () => {
    expect(moveCounter(newGame('classic'))).toBeNull();
  });

  it('counts moves in Vanishing and warns from move 50', () => {
    const s = playAll(newGame('vanishing'), [0, 1, 2, 4]);
    expect(moveCounter(s)).toEqual({ text: 'Move 4 / 60', warn: false });
    const near = { ...s, moves: 50 };
    expect(moveCounter(near)?.warn).toBe(true);
    expect(moveCounter(near)?.text).toBe('Move 50 / 60: a draw is called at 60');
  });
});

describe('game over text', () => {
  it('adds the next step after the result', () => {
    const won = playAll(newGame('classic'), [0, 3, 1, 4, 2]);
    expect(gameOverText(won, 'cpu')).toBe('You win! Press N for another round');
    expect(gameOverText(won, 'human')).toBe('Player X wins! Press N for another round');
  });
});

describe('honest level labels', () => {
  it('Expert is the one name for the top level in both variants', () => {
    expect(levelName('hard', 'classic')).toBe('Expert');
    expect(levelName('hard', 'vanishing')).toBe('Expert');
    expect(levelDescription('hard', 'vanishing')).toContain('can still be beaten');
    expect(levelName('strong', 'classic')).toBe('Hard');
  });

  it('summarises options on one line', () => {
    expect(optionsSummary(DEFAULT_SETTINGS)).toBe('vs CPU · Medium · Classic');
    expect(optionsSummary({ ...DEFAULT_SETTINGS, opponent: 'human', variant: 'vanishing' })).toBe('2 Players · Vanishing');
  });
});

describe('result banner', () => {
  const xWin = playAll(newGame('classic'), [0, 3, 1, 4, 2]);
  const oWin = playAll(newGame('classic'), [0, 3, 1, 4, 8, 5]);
  const draw = playAll(newGame('classic'), [0, 1, 2, 4, 3, 5, 7, 6, 8]);

  it('is null while the round runs', () => {
    expect(resultBanner(newGame('classic'), 'cpu')).toBeNull();
  });
  it('names win, loss and draw with a tone', () => {
    expect(resultBanner(xWin, 'cpu')).toMatchObject({ title: 'You win!', tone: 'win' });
    expect(resultBanner(oWin, 'cpu')).toMatchObject({ title: 'CPU wins this one.', tone: 'lose' });
    expect(resultBanner(draw, 'cpu')).toMatchObject({ tone: 'draw' });
  });
  it('treats either winner as a win in two-player', () => {
    expect(resultBanner(oWin, 'human')).toMatchObject({ title: 'Player O wins!', tone: 'win' });
  });
});

describe('options and auto-pause rules', () => {
  it('opens Game options only before the first round, on roomy screens', () => {
    expect(shouldOpenOptions(0, 800)).toBe(true);
    expect(shouldOpenOptions(1, 800)).toBe(false);
    expect(shouldOpenOptions(0, 400)).toBe(false);
  });
  it('auto-pauses only when the page is hidden or lost focus', () => {
    expect(shouldAutoPause(true, true, true)).toBe(true);
    expect(shouldAutoPause(true, false, false)).toBe(true);
    expect(shouldAutoPause(true, false, true)).toBe(false);
    expect(shouldAutoPause(false, true, false)).toBe(false);
  });
});
