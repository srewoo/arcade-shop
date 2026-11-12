import { describe, expect, it } from 'vitest';
import { showcaseZ } from '../src/renderShowcase';
import { hash } from '../src/renderTextures';
import { shades } from '../src/carPaint';

describe('title showcase and art helpers', () => {
  it('scrolls with time, and holds still under Reduce motion', () => {
    expect(showcaseZ(2, false)).toBeGreaterThan(showcaseZ(1, false));
    expect(showcaseZ(5, true)).toBe(0);
  });
  it('hash is deterministic and in [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      expect(hash(i)).toBe(hash(i));
      expect(hash(i)).toBeGreaterThanOrEqual(0);
      expect(hash(i)).toBeLessThan(1);
    }
  });
  it('shades keep light > main > dark > deep ordering of lightness', () => {
    const l = (s: string): number => Number(/(\d+)%\)$/.exec(s)?.[1]);
    const c = shades(210, 62, 60);
    expect(l(c.light)).toBeGreaterThan(l(c.main));
    expect(l(c.main)).toBeGreaterThan(l(c.dark));
    expect(l(c.dark)).toBeGreaterThan(l(c.deep));
  });
});
