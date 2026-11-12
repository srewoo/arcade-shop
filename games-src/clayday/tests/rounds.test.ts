import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { ratingFor, roundParams } from '../src/rounds';

describe('roundParams', () => {
  it('round 1 is gentle: no wind, no minis, generous clock', () => {
    const p = roundParams(1);
    expect(p.windMax).toBe(0);
    expect(p.miniChance).toBe(0);
    expect(p.goldChance).toBe(0);
    expect(p.passHits).toBe(CONFIG.round.passBase);
    expect(p.timeSec).toBe(CONFIG.round.baseTimeSec);
    expect(p.flightScale).toBe(1);
  });
  it('wind starts at the configured round and grows to a cap', () => {
    expect(roundParams(CONFIG.wind.from - 1).windMax).toBe(0);
    expect(roundParams(CONFIG.wind.from).windMax).toBeGreaterThan(0);
    expect(roundParams(3).windMax).toBeLessThan(roundParams(6).windMax);
    expect(roundParams(99).windMax).toBe(CONFIG.wind.max);
  });
  it('difficulty ramps monotonically and respects floors and caps', () => {
    for (let n = 1; n < 40; n++) {
      const a = roundParams(n);
      const b = roundParams(n + 1);
      expect(b.flightScale).toBeLessThanOrEqual(a.flightScale);
      expect(b.timeSec).toBeLessThanOrEqual(a.timeSec);
      expect(b.passHits).toBeGreaterThanOrEqual(a.passHits);
      expect(b.spread).toBeLessThanOrEqual(a.spread);
      expect(b.spread).toBeGreaterThanOrEqual(CONFIG.gun.minSpread);
      expect(b.passHits).toBeLessThanOrEqual(CONFIG.round.passMax);
      expect(b.timeSec).toBeGreaterThanOrEqual(CONFIG.round.minTimeSec);
    }
  });
  it('practice has no clock, wind or pass mark', () => {
    const p = roundParams(8, 'practice');
    expect([p.timeSec, p.windMax, p.passHits]).toEqual([0, 0, 0]);
    expect(p.flightScale).toBeLessThan(1);
  });
  it('treats junk round numbers safely', () => {
    expect(roundParams(0).round).toBe(1);
    expect(roundParams(2.9).round).toBe(2);
  });
});

describe('ratingFor', () => {
  it('maps hit counts onto the ladder', () => {
    expect(ratingFor(25, 25)).toBe('perfect');
    expect(ratingFor(22, 25)).toBe('ace');
    expect(ratingFor(18, 25)).toBe('marksman');
    expect(ratingFor(14, 25)).toBe('sporting');
    expect(ratingFor(9, 25)).toBe('novice');
    expect(ratingFor(0, 25)).toBe('bystander');
  });
  it('is monotone in hits', () => {
    const order = ['bystander', 'novice', 'sporting', 'marksman', 'ace', 'perfect'];
    let prev = 0;
    for (let h = 0; h <= 25; h++) {
      const i = order.indexOf(ratingFor(h, 25));
      expect(i).toBeGreaterThanOrEqual(prev);
      prev = i;
    }
  });
  it('handles an empty round', () => {
    expect(ratingFor(0, 0)).toBe('bystander');
  });
});
