import { describe, expect, it } from 'vitest';
import { KIND_LABEL, holeOrder, isCelebration, relLabel, scoreKind, winners } from '../src/game/scoring';

describe('scoring names', () => {
  it.each([
    [1, 3, 'ace'], [1, 2, 'ace'], [2, 5, 'albatross'], [2, 4, 'eagle'], [2, 3, 'birdie'], [3, 3, 'par'], [4, 3, 'bogey'], [5, 3, 'double'],
    [6, 3, 'triple'], [7, 3, 'over'], [3, 5, 'eagle'], [2, 2, 'par'],
  ] as const)('%i strokes on par %i is %s', (s, par, kind) => {
    expect(scoreKind(s, par)).toBe(kind);
  });
  it('a pick-up is its own result', () => expect(scoreKind(8, 3, true)).toBe('pickup'));
  it('celebrates birdie or better only', () => {
    expect(['ace', 'albatross', 'eagle', 'birdie'].every((k) => isCelebration(k as never))).toBe(true);
    expect(['par', 'bogey', 'pickup'].some((k) => isCelebration(k as never))).toBe(false);
  });
  it('labels', () => {
    expect(KIND_LABEL.ace).toBe('Hole in one!');
    expect(KIND_LABEL.birdie).toBe('Birdie!');
    expect(relLabel(0)).toBe('E');
    expect(relLabel(3)).toBe('+3');
    expect(relLabel(-2)).toBe('-2');
  });
});

describe('standings and order', () => {
  it('winners share ties', () => {
    expect(winners([10, 8, 8, 12])).toEqual([1, 2]);
    expect(winners([5])).toEqual([0]);
  });
  it('lowest previous score tees off first, ties keep seat order', () => {
    expect(holeOrder([4, 2, 3, 2])).toEqual([1, 3, 2, 0]);
    expect(holeOrder([3, 3])).toEqual([0, 1]);
  });
});
