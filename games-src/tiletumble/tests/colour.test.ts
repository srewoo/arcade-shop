import { describe, expect, it } from 'vitest';
import { rgba, shade } from '../src/ui/colour';

describe('colour helpers', () => {
  it('shade mixes towards white or black', () => {
    expect(shade('#808080', 1)).toBe('rgb(255,255,255)');
    expect(shade('#808080', -1)).toBe('rgb(0,0,0)');
    expect(shade('#ff0000', 0)).toBe('rgb(255,0,0)');
  });
  it('rgba keeps the channels', () => {
    expect(rgba('#3fd98f', 0.5)).toBe('rgba(63,217,143,0.5)');
  });
});
