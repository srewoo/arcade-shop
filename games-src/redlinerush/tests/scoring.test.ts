import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { distancePoints, finishBonus, isNearMiss, multiplier, nearPoints, topSpeed } from '../src/scoring';

describe('scoring', () => {
  it('multiplier steps up every few near misses and caps', () => {
    expect(multiplier(0)).toBe(1);
    expect(multiplier(1)).toBe(1);
    expect(multiplier(3)).toBe(1);
    expect(multiplier(4)).toBe(2);
    expect(multiplier(7)).toBe(3);
    expect(multiplier(999)).toBe(CONFIG.scoring.maxMult);
  });
  it('near-miss points scale with combo and double while boosted', () => {
    expect(nearPoints(1, false)).toBe(CONFIG.scoring.near);
    expect(nearPoints(4, false)).toBe(CONFIG.scoring.near * 2);
    expect(nearPoints(1, true)).toBe(CONFIG.scoring.near * CONFIG.scoring.boostMul);
  });
  it('near miss needs clearance in (0, gap)', () => {
    expect(isNearMiss(-0.01)).toBe(false);
    expect(isNearMiss(0)).toBe(true);
    expect(isNearMiss(CONFIG.scoring.nearGap - 0.01)).toBe(true);
    expect(isNearMiss(CONFIG.scoring.nearGap)).toBe(false);
  });
  it('distance points are linear', () => {
    expect(distancePoints(100)).toBe(100 * CONFIG.scoring.perUnit);
  });
  it('finish bonus rewards remaining time and ignores negatives', () => {
    expect(finishBonus(10)).toBe(CONFIG.trial.finishPoints + 10 * CONFIG.trial.timePoints);
    expect(finishBonus(-5)).toBe(CONFIG.trial.finishPoints);
  });
  it('top speed ramps with distance and is capped', () => {
    expect(topSpeed(0)).toBe(CONFIG.speed.baseTop);
    expect(topSpeed(2000)).toBeGreaterThan(topSpeed(1000));
    expect(topSpeed(1e9)).toBe(CONFIG.speed.topCap);
  });
});
