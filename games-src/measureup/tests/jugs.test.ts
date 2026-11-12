import { describe, expect, it } from 'vitest';
import { applyMove, isGoal, legalMoves, validateShape } from '../src/jugs';

const caps = [3, 5];

describe('applyMove', () => {
  it('fills to the brim and refuses to refill a full jug', () => {
    expect(applyMove(caps, [0, 0], { kind: 'fill', jug: 1 })).toEqual([0, 5]);
    expect(applyMove(caps, [0, 5], { kind: 'fill', jug: 1 })).toBeNull();
  });
  it('empties fully and refuses to empty an empty jug', () => {
    expect(applyMove(caps, [2, 4], { kind: 'empty', jug: 1 })).toEqual([2, 0]);
    expect(applyMove(caps, [2, 0], { kind: 'empty', jug: 1 })).toBeNull();
  });
  it('pours until the source is empty', () => {
    expect(applyMove(caps, [2, 1], { kind: 'pour', from: 0, to: 1 })).toEqual([0, 3]);
  });
  it('pours until the target is full and keeps the rest', () => {
    expect(applyMove(caps, [3, 4], { kind: 'pour', from: 0, to: 1 })).toEqual([2, 5]);
  });
  it('rejects pours that change nothing', () => {
    expect(applyMove(caps, [0, 3], { kind: 'pour', from: 0, to: 1 })).toBeNull();
    expect(applyMove(caps, [3, 5], { kind: 'pour', from: 0, to: 1 })).toBeNull();
    expect(applyMove(caps, [3, 1], { kind: 'pour', from: 0, to: 0 })).toBeNull();
  });
  it('rejects out-of-range jugs', () => {
    expect(applyMove(caps, [0, 0], { kind: 'fill', jug: 7 })).toBeNull();
    expect(applyMove(caps, [1, 1], { kind: 'pour', from: 0, to: 9 })).toBeNull();
  });
  it('never mutates its input and conserves water on pours', () => {
    const before = [3, 2];
    const after = applyMove(caps, before, { kind: 'pour', from: 0, to: 1 });
    expect(before).toEqual([3, 2]);
    expect((after ?? []).reduce((a, b) => a + b, 0)).toBe(5);
  });
});

describe('legalMoves and goals', () => {
  it('from empty only fills are legal', () => {
    expect(legalMoves(caps, [0, 0]).every((m) => m.kind === 'fill')).toBe(true);
    expect(legalMoves(caps, [0, 0])).toHaveLength(2);
  });
  it('counts every legal move from a mixed state', () => {
    // fill none full -> 2 fills, 2 empties, 2 pours
    expect(legalMoves(caps, [1, 2])).toHaveLength(6);
  });
  it('isGoal needs `count` jugs on the exact amount', () => {
    expect(isGoal([4, 1], { amount: 4, count: 1 })).toBe(true);
    expect(isGoal([4, 1], { amount: 4, count: 2 })).toBe(false);
    expect(isGoal([4, 4, 0], { amount: 4, count: 2 })).toBe(true);
  });
  it('validateShape flags malformed levels', () => {
    expect(validateShape([3, 5], [0, 0], { amount: 4, count: 1 })).toBeNull();
    expect(validateShape([3], [0], { amount: 1, count: 1 })).not.toBeNull();
    expect(validateShape([3, 5], [4, 0], { amount: 1, count: 1 })).not.toBeNull();
    expect(validateShape([3, 5], [0, 0], { amount: 1, count: 3 })).not.toBeNull();
    expect(validateShape([3, 5], [0], { amount: 1, count: 1 })).not.toBeNull();
    expect(validateShape([3, 25], [0, 0], { amount: 1, count: 1 })).not.toBeNull();
  });
});
