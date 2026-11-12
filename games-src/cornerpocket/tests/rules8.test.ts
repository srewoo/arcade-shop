import { describe, expect, it } from 'vitest';
import { type EightState, initialEight, legalTargets, resolveShot } from '../src/rules8';
import type { ShotReport } from '../src/sim';

const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const rep = (p: Partial<ShotReport>): ShotReport => ({
  firstHit: null, potted: [], cuePotted: false, onTableBefore: all, ...p,
});
const assigned = (cur: 0 | 1 = 0): EightState => ({
  ...initialEight(cur), groups: cur === 0 ? ['solids', 'stripes'] : ['stripes', 'solids'],
});

describe('group assignment', () => {
  it('assigns the potted ball group and keeps the turn', () => {
    const s = resolveShot(initialEight(0), rep({ firstHit: 3, potted: [3] }));
    expect(s.groups).toEqual(['solids', 'stripes']);
    expect(s.current).toBe(0);
  });
  it('gives stripes to player 2 when they pot a stripe on an open table', () => {
    const s = resolveShot(initialEight(1), rep({ firstHit: 12, potted: [12] }));
    expect(s.groups).toEqual(['solids', 'stripes']);
    expect(s.current).toBe(1);
  });
  it('does not assign on a foul', () => {
    const s = resolveShot(initialEight(0), rep({ firstHit: 3, potted: [3], cuePotted: true }));
    expect(s.groups).toEqual([null, null]);
  });
  it('passes the turn after a plain miss', () => {
    const s = resolveShot(initialEight(0), rep({ firstHit: 3 }));
    expect(s.current).toBe(1);
    expect(s.ballInHand).toBe(false);
  });
});

describe('fouls', () => {
  it('scratch gives ball in hand to the opponent', () => {
    const s = resolveShot(assigned(0), rep({ firstHit: 2, potted: [2], cuePotted: true }));
    expect(s.current).toBe(1);
    expect(s.ballInHand).toBe(true);
    expect(s.winner).toBeNull();
  });
  it('hitting the wrong group first is a foul', () => {
    const s = resolveShot(assigned(0), rep({ firstHit: 10, potted: [2] }));
    expect(s.current).toBe(1);
    expect(s.ballInHand).toBe(true);
  });
  it('hitting nothing is a foul', () => {
    expect(resolveShot(assigned(0), rep({})).ballInHand).toBe(true);
  });
});

describe('the 8 ball', () => {
  it('potting the 8 early loses', () => {
    const s = resolveShot(assigned(0), rep({ firstHit: 1, potted: [8] }));
    expect(s.winner).toBe(1);
  });
  it('potting the 8 on the break loses', () => {
    expect(resolveShot(initialEight(0), rep({ firstHit: 1, potted: [8] })).winner).toBe(1);
  });
  it('potting the 8 after clearing the group wins', () => {
    const s = resolveShot(assigned(0), rep({ firstHit: 8, potted: [8], onTableBefore: [8, 9, 10] }));
    expect(s.winner).toBe(0);
  });
  it('potting the 8 with the cue ball loses even when the group is clear', () => {
    const s = resolveShot(assigned(0), rep({ firstHit: 8, potted: [8], cuePotted: true, onTableBefore: [8, 9] }));
    expect(s.winner).toBe(1);
  });
  it('the 8 becomes the only legal target once the group is cleared', () => {
    expect(legalTargets(assigned(0), [8, 9, 10])).toEqual([8]);
    expect(legalTargets(assigned(0), [1, 8, 9])).toEqual([1]);
    expect(legalTargets(initialEight(0), [1, 8, 9])).toEqual([1, 9]);
  });
});
