import { describe, expect, it } from 'vitest';
import { frameIndexOfLastRoll, provisionalMark } from '../src/provisional';
import { fitFontPx } from '../src/render/fit';

describe('provisionalMark', () => {
  it('is null until something falls', () => {
    expect(provisionalMark([], 0)).toBeNull();
  });
  it('shows the digit for the first ball of a fresh frame', () => {
    expect(provisionalMark([], 6)).toEqual({ frame: 0, index: 0, mark: '6' });
  });
  it('shows X for ten on a fresh rack', () => {
    expect(provisionalMark([3, 4], 10)).toEqual({ frame: 1, index: 0, mark: 'X' });
  });
  it('shows a spare slash on the second ball', () => {
    expect(provisionalMark([7], 3)).toEqual({ frame: 0, index: 1, mark: '/' });
  });
  it('shows a plain count on the second ball', () => {
    expect(provisionalMark([7], 2)).toEqual({ frame: 0, index: 1, mark: '2' });
  });
  it('rejects impossible counts and finished games', () => {
    expect(provisionalMark([7], 4)).toBeNull();
    expect(provisionalMark([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], 3)).toBeNull();
    expect(provisionalMark([], 1.5)).toBeNull();
  });
  it('handles the tenth frame fill balls', () => {
    const rolls = [...Array(9).fill(10), 10];
    expect(provisionalMark(rolls, 10)).toEqual({ frame: 9, index: 1, mark: 'X' });
    expect(provisionalMark([...Array(9).fill(10), 4, 6], 10)).toEqual({ frame: 9, index: 2, mark: 'X' });
  });
});

describe('frameIndexOfLastRoll', () => {
  it('maps the roll list to a 0-based frame', () => {
    expect(frameIndexOfLastRoll([])).toBe(0);
    expect(frameIndexOfLastRoll([10])).toBe(0);
    expect(frameIndexOfLastRoll([10, 4])).toBe(1);
    expect(frameIndexOfLastRoll([10, 4, 5])).toBe(1);
    expect(frameIndexOfLastRoll([10, 4, 5, 2])).toBe(2);
  });
});

describe('fitFontPx', () => {
  it('keeps the size when the text already fits', () => {
    expect(fitFontPx(50, 10, 60)).toBe(10);
  });
  it('shrinks proportionally to fit the card', () => {
    expect(fitFontPx(120, 10, 60)).toBe(6);
    expect(fitFontPx(100, 20, 50)).toBe(10);
  });
  it('never goes below the minimum or on bad input', () => {
    expect(fitFontPx(1000, 10, 10, 6)).toBe(6);
    expect(fitFontPx(0, 10, 10)).toBe(10);
  });
});
