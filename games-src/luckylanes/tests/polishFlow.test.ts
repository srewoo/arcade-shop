import { describe, expect, it } from 'vitest';
import { canSkip, Pacing } from '../src/turnFlow';
import { bowlingLevel, resultsDelayMs, resultTier } from '../src/resultsText';
import { createMatch, recordRoll } from '../src/match';
import { TUNING } from '../src/tuning';

describe('no accidental skip after a human throw', () => {
  const g = TUNING.timing.skipGuardS;
  it('the pin-fall (settle, sweep) cannot be skipped after a human throw', () => {
    expect(canSkip('settle', 5, false)).toBe(false);
    expect(canSkip('sweep', 5, false)).toBe(false);
    expect(canSkip('rolling', 5, false)).toBe(false);
  });
  it('the banner wait is skippable only after the guard time', () => {
    expect(canSkip('banner', g - 0.01, false)).toBe(false);
    expect(canSkip('banner', g, false)).toBe(true);
  });
  it('CPU waits can always be skipped', () => {
    expect(canSkip('cpu', 0, false)).toBe(true);
    expect(canSkip('settle', 0, true)).toBe(true);
    expect(canSkip('ready', 9, true)).toBe(false);
  });
  it('Pacing.request honours the guard and does not latch a refused skip', () => {
    const p = new Pacing();
    p.noteThrow(false);
    expect(p.request('settle', 3)).toBe(false);
    expect(p.request('banner', 0.1)).toBe(false);
    expect(p.scale('banner')).toBe(1);
    expect(p.request('banner', g + 0.1)).toBe(true);
    expect(p.scale('banner')).toBe(TUNING.timing.fastForward);
  });
});

describe('result tiers', () => {
  it('bowling tiers step at 100, 150, 200 and 300', () => {
    expect([0, 99, 100, 149, 150, 199, 200, 299, 300].map(bowlingLevel)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4]);
  });
  it('a fresh match is the lowest, quiet tier', () => {
    const t = resultTier(createMatch({ mode: 'solo', players: 1, cpuLevel: 'casual' }));
    expect(t).toMatchObject({ level: 0, big: false });
  });
  it('twelve strikes is a perfect game', () => {
    let m = createMatch({ mode: 'solo', players: 1, cpuLevel: 'casual' });
    for (let i = 0; i < 12 && !m.over; i++) m = recordRoll(m, new Array<boolean>(10).fill(false));
    const t = resultTier(m);
    expect(t.level).toBe(4);
    expect(t.big).toBe(true);
  });
  it('the payoff delay is longest for big tiers and short under reduced motion', () => {
    const big = { level: 4, label: '', big: true };
    const quiet = { level: 0, label: '', big: false };
    expect(resultsDelayMs(big, false)).toBeGreaterThan(resultsDelayMs(quiet, false));
    expect(resultsDelayMs(big, true)).toBe(TUNING.timing.resultsDelayReducedMs);
  });
});
