import { describe, expect, it } from 'vitest';
import { boardFromRows, discCount } from '../src/board';
import { CONFIG } from '../src/config';
import { generatePuzzle, isValidDeal, randomBoard } from '../src/generator';
import { dailySeed, Rng } from '../src/rng';
import { solve } from '../src/solver';

describe('solver', () => {
  it('clears a trivial board and awards the bonus', () => {
    const r = solve(boardFromRows(['00']));
    expect(r.cleared).toBe(true);
    expect(r.score).toBe(CONFIG.scoring.clearBonus);
    expect(r.moves).toBe(1);
  });
  it('prefers one big group over splitting it', () => {
    const r = solve(boardFromRows(['0000']));
    expect(r.path).toHaveLength(1);
    expect(r.score).toBe(4 + CONFIG.scoring.clearBonus);
  });
  it('reports a stuck board with leftovers', () => {
    const r = solve(boardFromRows(['01', '10']));
    expect(r).toMatchObject({ moves: 0, score: 0, cleared: false, leftover: 4 });
  });
  it('respects the move limit and never scores less with more moves', () => {
    const b = randomBoard(new Rng(11), 8, 9, 4);
    const one = solve(b, 1);
    const five = solve(b, 5);
    expect(one.moves).toBeLessThanOrEqual(1);
    expect(five.moves).toBeLessThanOrEqual(5);
    expect(five.score).toBeGreaterThanOrEqual(one.score);
  });
  it('is deterministic', () => {
    const b = randomBoard(new Rng(3), 8, 9, 4);
    expect(solve(b, 6)).toEqual(solve(b, 6));
  });
});

describe('level validation', () => {
  it('generates the same puzzle for the same seed', () => {
    const a = generatePuzzle(123, 4);
    const b = generatePuzzle(123, 4);
    expect(a.board).toEqual(b.board);
    expect(a.attempt).toBe(b.attempt);
  });
  it('produces full, valid, solver-checked boards across seeds', () => {
    for (const seed of [1, 2, 3, 4]) {
      const p = generatePuzzle(seed, 4);
      expect(discCount(p.board)).toBe(CONFIG.board.cols * CONFIG.board.rows);
      expect(p.valid).toBe(true);
      expect(isValidDeal(p.board, 4, p.solution)).toBe(true);
      expect(p.solution.leftover).toBeLessThanOrEqual(CONFIG.validation.maxLeftoverShare * discCount(p.board));
    }
  });
  it('rejects a board missing a colour or too hard to clear', () => {
    const b = boardFromRows(['0101', '1010']);
    expect(isValidDeal(b, 2, solve(b))).toBe(false);
  });
  it('daily boards are stable per date and valid with five colours', () => {
    const p = generatePuzzle(dailySeed('2026-11-11'), CONFIG.modes.daily.colours);
    expect(p.valid).toBe(true);
    expect(generatePuzzle(dailySeed('2026-11-11'), CONFIG.modes.daily.colours).board).toEqual(p.board);
  });
}, 60000);
