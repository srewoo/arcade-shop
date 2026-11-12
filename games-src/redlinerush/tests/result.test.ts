import { describe, expect, it } from 'vitest';
import { countValue, tierFor, tipFor } from '../src/result';
import { TIPS } from '../src/strings';

describe('tierFor', () => {
  it('maps score bands to tiers', () => {
    expect(tierFor(0)).toBe('rookie');
    expect(tierFor(299)).toBe('rookie');
    expect(tierFor(300)).toBe('street');
    expect(tierFor(1000)).toBe('ace');
    expect(tierFor(2500)).toBe('legend');
  });
});

describe('tipFor', () => {
  const base = { outcome: 'crash', nearMisses: 4, crashes: 3, maxCombo: 2 } as const;
  it('teaches skimming when there were no near misses', () => {
    expect(tipFor({ ...base, nearMisses: 0 })).toBe(TIPS.noSkim);
  });
  it('gives outcome specific advice', () => {
    expect(tipFor({ ...base, outcome: 'fuel' })).toBe(TIPS.fuel);
    expect(tipFor({ ...base, outcome: 'time' })).toBe(TIPS.time);
    expect(tipFor({ ...base, outcome: 'finish' })).toBe(TIPS.finish);
    expect(tipFor(base)).toBe(TIPS.crashes);
    expect(tipFor({ ...base, maxCombo: 6 })).toBe(TIPS.chain);
  });
});

describe('countValue', () => {
  it('starts at 0, ends at the target and never overshoots', () => {
    expect(countValue(500, 0)).toBe(0);
    expect(countValue(500, 1)).toBe(500);
    expect(countValue(500, 2)).toBe(500);
    expect(countValue(500, -1)).toBe(0);
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.1) {
      const v = countValue(500, t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
