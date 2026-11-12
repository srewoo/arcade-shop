import { describe, expect, it } from 'vitest';
import { alignmentFor, closeness, mixHex, overlapFraction } from '../src/alignment';
import { makeCar } from '../src/car';
import { LEVELS } from '../src/levels';
import { fitView } from '../src/render/camera';
import { scaledCount } from '../src/render/fx';
import { starGlyphs, starNote, tierFor } from '../src/scoring';
import { DEFAULT_SETTINGS } from '../src/settings';

const L1 = LEVELS[0]!;

describe('alignmentFor', () => {
  it('is near 1 when the car sits in the bay, straight', () => {
    const b = L1.bay;
    const car = makeCar(b.x - 1.3 * Math.cos(b.a), b.y - 1.3 * Math.sin(b.a), b.a);
    const al = alignmentFor(car, L1);
    expect(al.overlap).toBeGreaterThan(0.95);
    expect(al.angleOk).toBe(true);
    expect(al.quality).toBeGreaterThan(0.9);
  });
  it('is 0 far from the bay', () => {
    expect(alignmentFor(makeCar(L1.world.w - 1, L1.world.h - 1, 0), L1).overlap).toBe(0);
  });
  it('reports heading error symmetric to 180 degrees', () => {
    const b = L1.bay;
    const straight = alignmentFor(makeCar(b.x, b.y, b.a), L1).angleDeg;
    const flipped = alignmentFor(makeCar(b.x, b.y, b.a + Math.PI), L1).angleDeg;
    expect(straight).toBeCloseTo(0, 5);
    expect(flipped).toBeCloseTo(0, 5);
    expect(alignmentFor(makeCar(b.x, b.y, b.a + 0.5), L1).angleOk).toBe(false);
  });
  it('overlapFraction is 1 for a body fully inside and 0 for outside', () => {
    const bay = { x: 0, y: 0, hw: 5, hh: 3, a: 0 };
    expect(overlapFraction({ x: 0, y: 0, hw: 1, hh: 1, a: 0 }, bay)).toBe(1);
    expect(overlapFraction({ x: 20, y: 0, hw: 1, hh: 1, a: 0 }, bay)).toBe(0);
  });
});

describe('closeness and mixHex', () => {
  it('is 1 in bay, 0 when poorly aligned, and monotonic', () => {
    expect(closeness(0.1, true)).toBe(1);
    expect(closeness(0.2, false)).toBe(0);
    expect(closeness(0.9, false)).toBeGreaterThan(closeness(0.7, false));
  });
  it('blends hex colours', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('fitView with a HUD inset', () => {
  it('keeps the lot below the reserved top strip', () => {
    const v = fitView(800, 600, 40, 20, 100);
    expect(v.ty).toBeGreaterThanOrEqual(100);
    expect(v.ty + 20 * v.scale).toBeLessThanOrEqual(600);
  });
  it('without an inset behaves as before (centred)', () => {
    const v = fitView(800, 600, 40, 20);
    expect(v.ty).toBeCloseTo((600 - 20 * v.scale) / 2, 6);
  });
});

describe('result tiers and star copy', () => {
  it('maps stars to tiers', () => {
    expect(tierFor(true, 3)).toBe('perfect');
    expect(tierFor(true, 2)).toBe('good');
    expect(tierFor(true, 1)).toBe('ok');
    expect(tierFor(false, 0)).toBe('fail');
  });
  it('never claims more than was earned', () => {
    expect(starNote(true, true, true)).toMatch(/full marks/);
    expect(starNote(true, false, false)).toMatch(/bumps/);
    expect(starNote(true, true, false)).toMatch(/over par/);
    expect(starNote(false, true, true)).toBe('No stars this time.');
  });
  it('shows a dash for unplayed levels and filled/outline stars otherwise', () => {
    expect(starGlyphs(undefined)).toBe('–');
    expect(starGlyphs(2)).toBe('★★☆');
  });
});

describe('reduce motion and defaults', () => {
  it('cuts particles to at most 40%', () => {
    expect(scaledCount(50, true)).toBeLessThanOrEqual(20);
    expect(scaledCount(50, false)).toBe(50);
  });
  it('colour-blind cues are on by default', () => {
    expect(DEFAULT_SETTINGS.colorAssist).toBe(true);
  });
});
