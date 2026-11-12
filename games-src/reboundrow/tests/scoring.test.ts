import { describe, expect, it } from 'vitest';
import { brickPoints, clearBonus, comboMultiplier } from '../src/sim/scoring';
import { createWorld, addScore } from '../src/sim/world';
import { CONFIG } from '../src/config';

describe('scoring', () => {
  it('combo multiplier grows then caps', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(5)).toBe(2);
    expect(comboMultiplier(10)).toBe(3);
    expect(comboMultiplier(999)).toBe(CONFIG.score.comboMaxMul);
  });
  it('breaking pays by max hp, a plain hit pays little', () => {
    expect(brickPoints(true, 1, 1)).toBe(10);
    expect(brickPoints(true, 3, 1)).toBe(30);
    expect(brickPoints(false, 3, 1)).toBe(5);
    expect(brickPoints(true, 2, 5)).toBe(40);
  });
  it('clear bonus rewards spare lives', () => {
    expect(clearBonus(3)).toBeGreaterThan(clearBonus(1));
    expect(clearBonus(-2)).toBe(clearBonus(0));
  });
  it('awards extra lives at thresholds up to the cap', () => {
    const w = createWorld(1);
    addScore(w, CONFIG.lives.extraEvery);
    expect(w.lives).toBe(CONFIG.lives.start + 1);
    addScore(w, CONFIG.lives.extraEvery * 10);
    expect(w.lives).toBe(CONFIG.lives.max);
  });
});
