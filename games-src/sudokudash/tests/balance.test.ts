import { describe, expect, it } from 'vitest';
import { BALANCE, DASH } from '../src/config/dash';
import { breakEvenPace, lossRate, parSeconds } from '../src/core/balance';
import { DIFFICULTIES } from '../src/core/grader';
import { mulberry32 } from '../src/core/rng';

describe('Dash balance', () => {
  it('a reference-pace player loses 10-30% of runs at every level (seeded Monte Carlo)', () => {
    for (const d of DIFFICULTIES) {
      const rate = lossRate(d, BALANCE.referencePace[d], mulberry32(7), 2000);
      expect(rate, d).toBeGreaterThanOrEqual(BALANCE.targetLossRate.min);
      expect(rate, d).toBeLessThanOrEqual(BALANCE.targetLossRate.max);
    }
  });

  it('a fast player (4 s per cell) practically never loses, a slow one (11 s) always does', () => {
    for (const d of DIFFICULTIES) {
      expect(lossRate(d, 4, mulberry32(3), 500), d).toBeLessThan(0.01);
      expect(lossRate(d, 11, mulberry32(3), 500), d).toBeGreaterThan(0.95);
    }
  });

  it('is no longer unlosable on Easy: the 7 s/cell player used to lose 0% and now loses ~1 in 5', () => {
    expect(lossRate('easy', 7, mulberry32(11), 2000)).toBeGreaterThan(0.1);
  });

  it('break-even pace sits just above the reference pace and rises with difficulty', () => {
    let prev = 0;
    for (const d of DIFFICULTIES) {
      const be = breakEvenPace(d, DASH.startSeconds[d], DASH.gainSeconds[d]);
      expect(be).toBeGreaterThan(BALANCE.referencePace[d]);
      expect(be).toBeLessThan(BALANCE.referencePace[d] * 1.3);
      expect(be).toBeGreaterThan(prev);
      prev = be;
    }
  });

  it('par time is pace times typical blanks', () => {
    expect(parSeconds('easy')).toBe(7 * 45);
  });

  it('config is sane: positive values, cap above 1, per-level tables complete', () => {
    for (const d of DIFFICULTIES) {
      expect(DASH.startSeconds[d]).toBeGreaterThan(0);
      expect(DASH.gainSeconds[d]).toBeGreaterThan(0);
    }
    expect(DASH.capFactor).toBeGreaterThan(1);
    expect(DASH.maxCombo).toBeGreaterThanOrEqual(2);
  });
});
