import { describe, expect, it } from 'vitest';
import { angleDiff, containedIn, corners, insideWorld, overlaps, wrapAngle } from '../src/geom';

const b = (x: number, y: number, hw: number, hh: number, a = 0) => ({ x, y, hw, hh, a });

describe('geometry', () => {
  it('wraps angles into (-PI, PI]', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(-Math.PI, 6);
    expect(wrapAngle(-2.5 * Math.PI)).toBeCloseTo(-Math.PI / 2, 6);
  });
  it('angleDiff treats opposite headings as equal on an axis', () => {
    expect(angleDiff(0, Math.PI, true)).toBeCloseTo(0, 6);
    expect(angleDiff(0, Math.PI, false)).toBeCloseTo(Math.PI, 6);
    expect(angleDiff(0.1, -0.1, true)).toBeCloseTo(0.2, 6);
  });
  it('detects overlap and separation of axis-aligned boxes', () => {
    expect(overlaps(b(0, 0, 1, 1), b(1.5, 0, 1, 1))).toBe(true);
    expect(overlaps(b(0, 0, 1, 1), b(2.5, 0, 1, 1))).toBe(false);
  });
  it('detects overlap for rotated boxes (diamond vs square)', () => {
    const diamond = b(0, 0, 1, 1, Math.PI / 4);
    expect(overlaps(diamond, b(2.0, 0, 0.5, 0.5))).toBe(false);
    expect(overlaps(diamond, b(1.2, 0, 0.5, 0.5))).toBe(true);
  });
  it('grow inflates the first box only', () => {
    expect(overlaps(b(0, 0, 1, 1), b(2.2, 0, 1, 1))).toBe(false);
    expect(overlaps(b(0, 0, 1, 1), b(2.2, 0, 1, 1), 0.3)).toBe(true);
  });
  it('containedIn honours tolerance', () => {
    expect(containedIn(b(0, 0, 1, 0.5), b(0, 0, 2, 1))).toBe(true);
    expect(containedIn(b(1.2, 0, 1, 0.5), b(0, 0, 2, 1))).toBe(false);
    expect(containedIn(b(1.2, 0, 1, 0.5), b(0, 0, 2, 1), 0.3)).toBe(true);
  });
  it('insideWorld checks every corner', () => {
    expect(insideWorld(b(5, 5, 1, 1), 10, 10)).toBe(true);
    expect(insideWorld(b(0.5, 5, 1, 1), 10, 10)).toBe(false);
    expect(corners(b(0, 0, 1, 2)).length).toBe(4);
  });
});
