import { describe, expect, it } from 'vitest';
import { isReducedMotion, touchVisible } from '../src/ui/appearance';

describe('appearance helpers', () => {
  it('reduce motion follows System only when set to system', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('touch controls follow the pointer unless forced', () => {
    expect(touchVisible('auto', true)).toBe(true);
    expect(touchVisible('auto', false)).toBe(false);
    expect(touchVisible('on', false)).toBe(true);
    expect(touchVisible('off', true)).toBe(false);
  });
});
