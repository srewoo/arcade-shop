import { describe, expect, it } from 'vitest';
import {
  createMatch, highScoreKey, humanScores, matchScore, pickLeaves, recordRoll, SPARE_CLEAR_BONUS, status, winners, type Match,
} from '../src/match';
import { countStanding, fullRack, maskFromNumbers } from '../src/pins';

/** Knock `n` pins from the current mask (lowest index first). */
function roll(m: Match, n: number): Match {
  const after = [...m.mask];
  let left = n;
  for (let i = 0; i < after.length && left > 0; i++) {
    if (after[i]) {
      after[i] = false;
      left--;
    }
  }
  return recordRoll(m, after);
}

describe('bowling matches', () => {
  it('plays a perfect solo game', () => {
    let m = createMatch({ mode: 'solo', players: 1, cpuLevel: 'easy' });
    for (let i = 0; i < 12; i++) m = roll(m, 10);
    expect(m.over).toBe(true);
    expect(matchScore(m, 0)).toBe(300);
    expect(humanScores(m)).toEqual([300]);
    expect(highScoreKey(m)).toBe('solo');
  });
  it('carries the leave to the second ball and respots after a frame', () => {
    let m = createMatch({ mode: 'solo', players: 1, cpuLevel: 'easy' });
    m = roll(m, 7);
    expect(countStanding(m.mask)).toBe(3);
    expect(status(m)).toEqual({ player: 0, frame: 1, ball: 2 });
    m = roll(m, 2);
    expect(countStanding(m.mask)).toBe(10);
    expect(status(m)).toEqual({ player: 0, frame: 2, ball: 1 });
  });
  it('rejects impossible rolls', () => {
    const m = roll(createMatch({ mode: 'solo', players: 1, cpuLevel: 'easy' }), 7);
    expect(() => recordRoll(m, fullRack())).toThrow();
  });
  it('alternates players frame by frame in hot seat', () => {
    let m = createMatch({ mode: 'hotseat', players: 3, cpuLevel: 'easy' });
    expect(m.players).toHaveLength(3);
    m = roll(m, 10);
    expect(m.current).toBe(1);
    m = roll(m, 3);
    expect(m.current).toBe(1);
    m = roll(m, 3);
    expect(m.current).toBe(2);
    m = roll(m, 0);
    m = roll(m, 0);
    expect(m.current).toBe(0);
    expect(status(m).frame).toBe(2);
  });
  it('finishes a 2-player game when both are complete', () => {
    let m = createMatch({ mode: 'hotseat', players: 2, cpuLevel: 'easy' });
    let guard = 0;
    while (!m.over && guard++ < 100) m = roll(m, 10);
    expect(m.over).toBe(true);
    expect(winners(m)).toEqual([0, 1]);
    expect(humanScores(m)).toEqual([300, 300]);
  });
  it('keeps the same player through the 10th frame bonus balls', () => {
    let m = createMatch({ mode: 'hotseat', players: 2, cpuLevel: 'easy' });
    for (let i = 0; i < 9; i++) {
      m = roll(m, 0);
      m = roll(m, 0);
      m = roll(m, 0);
      m = roll(m, 0);
    }
    m = roll(m, 10);
    expect(m.current).toBe(0);
    expect(countStanding(m.mask)).toBe(10);
    m = roll(m, 10);
    m = roll(m, 10);
    expect(m.current).toBe(1);
  });
  it('CPU mode has a human and a CPU and records only the human score', () => {
    let m = createMatch({ mode: 'cpu', players: 2, cpuLevel: 'pro' });
    expect(m.players.map((p) => p.cpu)).toEqual([false, true]);
    expect(highScoreKey(m)).toBe('cpuPro');
    let guard = 0;
    while (!m.over && guard++ < 100) m = roll(m, 10);
    expect(humanScores(m)).toHaveLength(1);
  });
});

describe('spare challenge', () => {
  it('serves ten distinct preset leaves', () => {
    const leaves = pickLeaves(42);
    expect(leaves).toHaveLength(10);
    expect(new Set(leaves.map((l) => l.join(','))).size).toBe(10);
    expect(pickLeaves(42)).toEqual(leaves);
  });
  it('scores knocked pins plus a clear bonus and ends after ten leaves', () => {
    let m = createMatch({ mode: 'spare', players: 1, cpuLevel: 'easy', seed: 7 });
    expect(m.mask).toEqual(maskFromNumbers(m.leaves[0] as number[]));
    let expected = 0;
    for (let i = 0; i < 10; i++) {
      const size = (m.leaves[i] as number[]).length;
      m = roll(m, size);
      expected += size + SPARE_CLEAR_BONUS;
    }
    expect(m.over).toBe(true);
    expect(matchScore(m, 0)).toBe(expected);
    expect(highScoreKey(m)).toBe('spare');
  });
  it('gives partial credit for a miss', () => {
    let m = createMatch({ mode: 'spare', players: 1, cpuLevel: 'easy', seed: 7 });
    const size = (m.leaves[0] as number[]).length;
    m = roll(m, 0);
    expect(matchScore(m, 0)).toBe(0);
    expect(status(m).frame).toBe(2);
    expect(size).toBeGreaterThan(0);
  });
});
