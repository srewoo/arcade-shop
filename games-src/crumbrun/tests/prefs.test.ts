import { describe, expect, it } from 'vitest';
import { resolveReducedMotion, textScale, volumeLevel } from '../src/prefs';

describe('prefs', () => {
  it('reduce motion: System follows the OS, On/Off override it', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
    expect(resolveReducedMotion('on', false)).toBe(true);
    expect(resolveReducedMotion('off', true)).toBe(false);
  });
  it('text size maps to a multiplier', () => {
    expect([100, 125, 150].map((n) => textScale(n as 100 | 125 | 150))).toEqual([1, 1.25, 1.5]);
  });
  it('volume is clamped and mute wins', () => {
    expect(volumeLevel(80, false)).toBeCloseTo(0.8);
    expect(volumeLevel(250, false)).toBe(1);
    expect(volumeLevel(-5, false)).toBe(0);
    expect(volumeLevel(100, true)).toBe(0);
  });
});
