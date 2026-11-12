import { describe, expect, it } from 'vitest';
import { Clock } from '../src/clock';
import { formatTime, resultKind, starThresholds, starsFor } from '../src/scoring';
import { S } from '../src/strings';

describe('stars', () => {
  it('3 stars at optimal, 2 within tolerance, 1 otherwise', () => {
    expect(starsFor(15, 15, 0)).toBe(3);
    expect(starsFor(16, 15, 0)).toBe(2);
    expect(starsFor(20, 15, 0)).toBe(2); // ceil(15 * 1.3) = 20
    expect(starsFor(21, 15, 0)).toBe(1);
  });
  it('a hint caps at 2 stars but never raises a low score', () => {
    expect(starsFor(15, 15, 1)).toBe(2);
    expect(starsFor(40, 15, 3)).toBe(1);
  });
});

describe('star rule and result copy', () => {
  it('thresholds match starsFor', () => {
    const t = starThresholds(15);
    expect(t).toEqual({ three: 15, two: 20 });
    expect(starsFor(t.three, 15, 0)).toBe(3);
    expect(starsFor(t.two, 15, 0)).toBe(2);
    expect(starsFor(t.two + 1, 15, 0)).toBe(1);
  });
  it('perfect only without hints', () => {
    expect(resultKind(8, 8, 0)).toBe('perfect');
    expect(resultKind(8, 8, 1)).toBe('hintCapped');
    expect(resultKind(9, 8, 0)).toBe('close');
    expect(resultKind(30, 8, 0)).toBe('done');
  });
  it('hint-capped copy never says perfect and explains the cap', () => {
    const note = S.resultNote(8, 8, 1);
    expect(note).not.toMatch(/perfect/i);
    expect(note).toMatch(/hint/);
    expect(note).toMatch(/2 stars/);
    expect(S.resultTitle.hintCapped).not.toMatch(/perfect/i);
    expect(S.win(8, 8, 2)).toBe(S.resultNote(8, 8, 2));
  });
  it('perfect copy states no hints', () => {
    expect(S.resultNote(8, 8, 0)).toMatch(/no hints/);
  });
  it('star rule strings state the thresholds', () => {
    expect(S.starRule(8, 11)).toContain('8 moves');
    expect(S.starRuleHinted(11)).toContain('2 stars');
  });
});

describe('formatTime', () => {
  it('formats m:ss and clamps negatives', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65_900)).toBe('1:05');
    expect(formatTime(-5)).toBe('0:00');
  });
});

describe('Clock', () => {
  it('accumulates only while running', () => {
    const c = new Clock();
    c.start(1000);
    c.stop(1500);
    expect(c.elapsed(9999)).toBe(500);
    c.start(2000);
    expect(c.running).toBe(true);
    expect(c.elapsed(2250)).toBe(750);
    c.start(5000); // second start is ignored
    expect(c.elapsed(2300)).toBe(800);
    c.reset();
    expect(c.elapsed(10)).toBe(0);
  });
});
