import { describe, expect, it } from 'vitest';
import { shade } from '../src/drawBubble';

describe('shade', () => {
  it('lightens toward white and darkens toward black', () => {
    expect(shade('#808080', 1)).toBe('rgb(255,255,255)');
    expect(shade('#808080', -1)).toBe('rgb(0,0,0)');
    expect(shade('#808080', 0)).toBe('rgb(128,128,128)');
  });

  it('keeps every channel within 0..255', () => {
    for (const amt of [-0.9, -0.3, 0.3, 0.9]) {
      const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(shade('#cf2e2e', amt));
      expect(m).not.toBeNull();
      for (const v of m!.slice(1).map(Number)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      }
    }
  });
});
