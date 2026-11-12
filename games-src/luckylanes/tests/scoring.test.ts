import { describe, expect, it } from 'vitest';
import {
  ballInFrame, currentFrame, freshRackNext, isGameComplete, isValidRoll, lastRollWasSpare, lastRollWasStrike,
  pinsStandingBeforeNext, scoreGame, strikeStreak, totalScore,
} from '../src/scoring';

const rep = (n: number, times: number): number[] => Array.from({ length: times }, () => n);

describe('totalScore', () => {
  it('scores a perfect game as 300', () => {
    const rolls = rep(10, 12);
    expect(totalScore(rolls)).toBe(300);
    expect(isGameComplete(rolls)).toBe(true);
  });
  it('scores a gutter game as 0', () => {
    expect(totalScore(rep(0, 20))).toBe(0);
    expect(isGameComplete(rep(0, 20))).toBe(true);
  });
  it('scores all 5-spares as 150', () => {
    expect(totalScore(rep(5, 21))).toBe(150);
  });
  it('scores nine-and-miss as 90', () => {
    expect(totalScore(rep(0, 0).concat(...Array.from({ length: 10 }, () => [9, 0])))).toBe(90);
  });
  it('scores all ones as 20', () => {
    expect(totalScore(rep(1, 20))).toBe(20);
  });
  it('matches a textbook mixed game (187)', () => {
    expect(totalScore([10, 9, 1, 5, 5, 7, 2, 10, 10, 10, 9, 0, 8, 2, 9, 1, 10])).toBe(187);
  });
  it('matches a textbook mixed game (167)', () => {
    expect(totalScore([10, 7, 3, 9, 0, 10, 0, 8, 8, 2, 0, 6, 10, 10, 10, 8, 1])).toBe(167);
  });
  it('scores nine strikes then X-9-0 as 288', () => {
    // frames 1-8 are 30 each (240), frame 9 = 29, frame 10 = 19
    expect(totalScore([...rep(10, 9), 10, 9, 0])).toBe(288);
  });
  it('handles 10th-frame variants', () => {
    const nine = rep(0, 18);
    expect(totalScore([...nine, 10, 10, 10])).toBe(30);
    expect(totalScore([...nine, 10, 5, 5])).toBe(20);
    expect(totalScore([...nine, 10, 0, 0])).toBe(10);
    expect(totalScore([...nine, 4, 6, 10])).toBe(20);
    expect(totalScore([...nine, 0, 10, 7])).toBe(17);
    expect(totalScore([...nine, 3, 4])).toBe(7);
  });
  it('credits strike bonus across frames', () => {
    expect(totalScore([10, 3, 4, ...rep(0, 14)])).toBe(24);
    expect(totalScore([10, 10, 3, 4, ...rep(0, 12)])).toBe(23 + 17 + 7);
  });
  it('credits spare bonus', () => {
    expect(totalScore([5, 5, 3, 0, ...rep(0, 16)])).toBe(16);
  });
});

describe('scoreGame views', () => {
  it('leaves totals null while bonuses are pending', () => {
    const v = scoreGame([10, 10]);
    expect(v[0]?.total).toBeNull();
    expect(v[1]?.total).toBeNull();
    const w = scoreGame([10, 10, 5]);
    expect(w[0]?.total).toBe(25);
    expect(w[1]?.total).toBeNull();
  });
  it('shows running totals', () => {
    const v = scoreGame([9, 1, 8, 0]);
    expect(v.map((f) => f.total)).toEqual([18, 26]);
  });
  it('renders symbols', () => {
    const v = scoreGame([10, 9, 1, 0, 3, 0, 10, ...rep(0, 10)]);
    expect(v[0]?.symbols).toEqual(['X']);
    expect(v[1]?.symbols).toEqual(['9', '/']);
    expect(v[2]?.symbols).toEqual(['-', '3']);
    expect(v[3]?.symbols).toEqual(['-', 'X'.replace('X', '/')]);
  });
  it('renders tenth-frame symbols', () => {
    const v = scoreGame([...rep(0, 18), 10, 10, 10]);
    expect(v[9]?.symbols).toEqual(['X', 'X', 'X']);
    const w = scoreGame([...rep(0, 18), 10, 3, 7]);
    expect(w[9]?.symbols).toEqual(['X', '3', '/']);
    const z = scoreGame([...rep(0, 18), 7, 3, 10]);
    expect(z[9]?.symbols).toEqual(['7', '/', 'X']);
  });
  it('never has more than ten frames', () => {
    expect(scoreGame(rep(10, 12))).toHaveLength(10);
  });
});

describe('turn state helpers', () => {
  it('tracks frame and ball', () => {
    expect(currentFrame([])).toBe(0);
    expect(ballInFrame([])).toBe(1);
    expect(currentFrame([3])).toBe(0);
    expect(ballInFrame([3])).toBe(2);
    expect(currentFrame([3, 4])).toBe(1);
    expect(currentFrame([10])).toBe(1);
    expect(currentFrame(rep(10, 9))).toBe(9);
    expect(ballInFrame([...rep(10, 9), 10])).toBe(2);
    expect(ballInFrame([...rep(10, 9), 10, 10])).toBe(3);
  });
  it('knows pins standing for the next roll', () => {
    expect(pinsStandingBeforeNext([])).toBe(10);
    expect(pinsStandingBeforeNext([7])).toBe(3);
    expect(pinsStandingBeforeNext([7, 3])).toBe(10);
    expect(pinsStandingBeforeNext([...rep(0, 18), 10])).toBe(10);
    expect(pinsStandingBeforeNext([...rep(0, 18), 10, 4])).toBe(6);
    expect(pinsStandingBeforeNext([...rep(0, 18), 10, 4, 6])).toBe(0);
    expect(pinsStandingBeforeNext([...rep(0, 18), 5, 5])).toBe(10);
    expect(freshRackNext([...rep(0, 18), 10, 10])).toBe(true);
  });
  it('validates rolls', () => {
    expect(isValidRoll([], 10)).toBe(true);
    expect(isValidRoll([7], 4)).toBe(false);
    expect(isValidRoll([7], 3)).toBe(true);
    expect(isValidRoll([], -1)).toBe(false);
    expect(isValidRoll([], 2.5)).toBe(false);
    expect(isValidRoll(rep(0, 20), 0)).toBe(false);
    expect(isValidRoll([...rep(0, 18), 10, 10], 10)).toBe(true);
  });
  it('detects strikes, spares and streaks', () => {
    expect(lastRollWasStrike([10])).toBe(true);
    expect(lastRollWasStrike([0, 10])).toBe(false);
    expect(lastRollWasSpare([0, 10])).toBe(true);
    expect(lastRollWasSpare([4, 6])).toBe(true);
    expect(lastRollWasSpare([10, 4])).toBe(false);
    expect(lastRollWasStrike([...rep(0, 18), 10, 10])).toBe(true);
    expect(lastRollWasSpare([...rep(0, 18), 10, 4, 6])).toBe(true);
    expect(lastRollWasStrike([...rep(0, 18), 4, 6, 10])).toBe(true);
    expect(strikeStreak([3, 4, 10, 10, 10])).toBe(3);
    expect(strikeStreak([])).toBe(0);
  });
});
