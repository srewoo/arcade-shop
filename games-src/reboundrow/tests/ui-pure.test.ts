import { describe, expect, it } from 'vitest';
import { clearTier } from '../src/sim/scoring';
import { LEVELS } from '../src/levels';
import { previewSvg } from '../src/ui/menu';
import { ART, brickAlive, demoBall, tri } from '../src/ui/titleArt';
import { createFx } from '../src/ui/fx';
import { PALETTE } from '../src/palette';

describe('clear tier', () => {
  it('maps lives lost to a tier and never reports a worse tier for fewer losses', () => {
    expect(clearTier(0)).toBe('flawless');
    expect(clearTier(1)).toBe('steady');
    expect(clearTier(2)).toBe('scraped');
    expect(clearTier(5)).toBe('scraped');
  });
});

describe('level preview', () => {
  it('draws one rect per brick and sizes the viewBox to the rows', () => {
    for (const lv of LEVELS) {
      const svg = previewSvg(lv.cells);
      const bricks = lv.cells.reduce((n, r) => n + r.filter(Boolean).length, 0);
      expect(svg.match(/<rect /g)?.length ?? 0).toBe(bricks);
      expect(svg).toContain(`viewBox="0 0 12 ${lv.cells.length}"`);
    }
  });
});

describe('title demo', () => {
  it('triangle wave stays in 0..1', () => {
    for (let t = -5; t < 20; t += 0.37) expect(tri(t, 1.7)).toBeGreaterThanOrEqual(0);
    for (let t = -5; t < 20; t += 0.37) expect(tri(t, 1.7)).toBeLessThanOrEqual(1);
  });
  it('ball stays between the walls, brick floor and paddle', () => {
    for (let t = 0; t < 30; t += 0.05) {
      const b = demoBall(t);
      expect(b.x).toBeGreaterThan(0);
      expect(b.x).toBeLessThan(ART.w);
      expect(b.y).toBeGreaterThan(ART.top + ART.rows * ART.bh);
      expect(b.y).toBeLessThan(ART.padY);
    }
    expect(typeof brickAlive(0, 0, 1)).toBe('boolean');
  });
});

describe('effects respect reduced motion', () => {
  it('cuts particles, skips shake and flashes, keeps popups static', () => {
    const full = createFx();
    const calm = createFx();
    calm.reduced = true;
    full.burst(10, 10, '#fff');
    calm.burst(10, 10, '#fff');
    expect(calm.particles.length).toBeLessThanOrEqual(Math.ceil(full.particles.length * 0.4) + 1);
    calm.kick();
    calm.hitFlash(1, 1);
    calm.confetti(100, 100);
    expect(calm.shake).toBe(0);
    expect(calm.flash).toBe(0);
    expect(calm.flashes).toHaveLength(0);
    full.kick();
    expect(full.shake).toBeGreaterThan(0);
    calm.popup(5, 50, '+10');
    const y0 = calm.popups[0]!.y;
    calm.update(0.1);
    expect(calm.popups[0]!.y).toBe(y0);
  });
  it('banner expires', () => {
    const fx = createFx();
    fx.announce('x');
    fx.update(5);
    expect(fx.banner).toBeNull();
  });
});

describe('row palette', () => {
  it('has distinct hues', () => {
    expect(new Set(PALETTE.rows).size).toBe(PALETTE.rows.length);
  });
});
