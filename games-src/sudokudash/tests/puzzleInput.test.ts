import { describe, expect, it } from 'vitest';
import { normalizePuzzleText, parsePuzzleCells, validatePuzzle } from '../src/core/puzzleInput';
import { PUZZLE, SOLUTION } from './fixtures';

const boxed = PUZZLE.match(/.{9}/g)!.map((r) => `${r.slice(0, 3)}|${r.slice(3, 6)}|${r.slice(6)}`).join('\n');

describe('user-entered puzzles', () => {
  it('accepts dots, zeros, spaces, line breaks and box drawing', () => {
    expect(normalizePuzzleText(boxed)).toBe(PUZZLE);
    expect(validatePuzzle(PUZZLE.replace(/\./g, '0')).ok).toBe(true);
    const spaced = PUZZLE.split('').join(' ');
    const res = validatePuzzle(spaced);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.solution.join('')).toBe(SOLUTION);
      expect(res.difficulty).toBe('easy');
      expect(res.clues).toBe(30);
    }
  });

  it('rejects the wrong length with a count', () => {
    const r = parsePuzzleCells(PUZZLE.slice(1));
    expect('error' in r && r.error).toContain('found 80');
    expect('error' in parsePuzzleCells('')).toBe(true);
  });

  it('rejects stray characters', () => {
    const r = validatePuzzle(`x${PUZZLE.slice(1)}`);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain('"x"');
  });

  it('rejects rule clashes and names the house', () => {
    const r = validatePuzzle(`55${PUZZLE.slice(2)}`);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/digit 5 appears twice in row 1 \(r1c1 and r1c2\)/);
  });

  it('rejects too few clues', () => {
    const r = validatePuzzle(`1${'.'.repeat(80)}`);
    expect(!r.ok && r.message).toContain('Only 1 clues');
  });

  it('rejects grids with several solutions', () => {
    const loose = SOLUTION.split('').map((d) => (d === '1' || d === '2' ? '.' : d)).join('');
    const r = validatePuzzle(loose);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain('more than one solution');
  });

  it('rejects grids with no solution', () => {
    const stuck = `${PUZZLE.slice(0, 2)}1${PUZZLE.slice(3)}`;
    const r = validatePuzzle(stuck);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain('no solution');
  });
});
