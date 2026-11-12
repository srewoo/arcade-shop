import { describe, expect, it } from 'vitest';
import { contrast, luminance } from '../src/contrast';
import { ACTOR_COLORS, HIGH_CONTRAST_THEME, THEMES, themeFor } from '../src/theme';

const ALL = [...THEMES, HIGH_CONTRAST_THEME];

describe('contrast helper', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe.each(ALL.map((t) => [t.name, t] as const))('theme %s', (_n, t) => {
  it('counters read against the floor at >= 3:1 (top and face)', () => {
    expect(contrast(t.wallTop, t.floorA)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.wallFace, t.floorA)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.wallTop, t.floorB)).toBeGreaterThanOrEqual(3);
    expect(contrast(t.wallFace, t.floorB)).toBeGreaterThanOrEqual(3);
  });

  it('the two floor tones are nearly identical (<= 1.1:1) so crumbs are not drowned out', () => {
    expect(contrast(t.floorA, t.floorB)).toBeLessThanOrEqual(1.1);
  });

  it('floor is dark (luminance <= 0.15) and, outside high contrast, not black', () => {
    expect(luminance(t.floorA)).toBeLessThanOrEqual(0.15);
    if (t !== HIGH_CONTRAST_THEME) expect(luminance(t.floorA)).toBeGreaterThanOrEqual(0.07);
  });

  it('Pip, the light actor rim, crumbs and the pistol halo each read >= 3:1 on both floors', () => {
    for (const c of [ACTOR_COLORS.pip, ACTOR_COLORS.rim, ACTOR_COLORS.crumb, ACTOR_COLORS.pistolHalo]) {
      expect(contrast(c, t.floorA)).toBeGreaterThanOrEqual(3);
      expect(contrast(c, t.floorB)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('themeFor', () => {
  it('wraps, and high contrast overrides', () => {
    expect(themeFor(3)).toBe(THEMES[0]);
    expect(themeFor(-1)).toBe(THEMES[2]);
    expect(themeFor(1, true)).toBe(HIGH_CONTRAST_THEME);
  });
});
