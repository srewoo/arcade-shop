import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { baseValue, comboMult, doubleBonus, hitScore, perfectBonus, timeBonus } from '../src/scoring';

describe('scoring', () => {
  it('combo starts at x1 and climbs by the step up to the cap', () => {
    expect(comboMult(0)).toBe(1);
    expect(comboMult(1)).toBe(1);
    expect(comboMult(2)).toBe(1 + CONFIG.score.comboStep);
    expect(comboMult(3)).toBe(1 + 2 * CONFIG.score.comboStep);
    expect(comboMult(500)).toBe(CONFIG.score.comboMax);
  });
  it('small and gold clays are worth more', () => {
    expect(baseValue('std')).toBe(CONFIG.score.hit);
    expect(baseValue('mini')).toBeGreaterThan(baseValue('std'));
    expect(baseValue('gold')).toBeGreaterThan(baseValue('mini'));
  });
  it('hit points multiply base by combo and round', () => {
    expect(hitScore('std', 1).points).toBe(100);
    expect(hitScore('std', 3).points).toBe(150);
    expect(hitScore('gold', 3)).toEqual({ base: 250, mult: 1.5, points: 375 });
  });
  it('double bonus scales with the combo', () => {
    expect(doubleBonus(1)).toBe(CONFIG.score.doubleBonus);
    expect(doubleBonus(5)).toBeGreaterThan(doubleBonus(1));
  });
  it('time bonus is whole seconds, never negative, none without a clock', () => {
    expect(timeBonus(12.9)).toBe(12 * CONFIG.score.timeBonusPerSec);
    expect(timeBonus(-3)).toBe(0);
    expect(timeBonus(Number.POSITIVE_INFINITY)).toBe(0);
  });
  it('perfect bonus only for a clean sweep', () => {
    expect(perfectBonus(25, 25)).toBe(CONFIG.score.perfectBonus);
    expect(perfectBonus(24, 25)).toBe(0);
    expect(perfectBonus(0, 0)).toBe(0);
  });
});
