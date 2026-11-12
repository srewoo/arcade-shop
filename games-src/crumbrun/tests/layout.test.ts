import { describe, expect, it } from 'vitest';
import { swipeDir } from '../src/input';
import { fitScale } from '../src/layout';

const size = { w: 378, h: 472 };

describe('fractional scaling', () => {
  it('uses every available pixel below 2x', () => {
    const f = fitScale(900, 1000, 1, size);
    expect(f.scale).toBeGreaterThan(1.9);
    expect(f.pxW).toBeLessThanOrEqual(900);
  });
  it('accounts for (capped) device pixel ratio', () => {
    const f = fitScale(400, 800, 2, size);
    expect(f.scale).toBeGreaterThanOrEqual(2);
    expect(f.cssW).toBeLessThanOrEqual(400);
  });
  it('falls back to a fractional scale on very small screens', () => {
    const f = fitScale(300, 400, 1, size);
    expect(f.scale).toBeLessThan(1);
    expect(f.pxW).toBeLessThanOrEqual(300);
  });
});

describe('swipe classification', () => {
  it('maps dominant axis to a direction', () => {
    expect(swipeDir(40, 5)).toBe('R');
    expect(swipeDir(-40, 5)).toBe('L');
    expect(swipeDir(3, 50)).toBe('D');
    expect(swipeDir(3, -50)).toBe('U');
  });
  it('treats small movement as a tap', () => {
    expect(swipeDir(5, 5)).toBeNull();
  });
});
