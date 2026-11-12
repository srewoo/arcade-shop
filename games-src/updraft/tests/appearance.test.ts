import { describe, expect, it } from 'vitest';
import { isReducedMotion } from '../src/ui/appearance';
import { Particles } from '../src/render/particles';
import { caveShare, computeView } from '../src/render/view';
import { CONFIG } from '../src/config';

describe('reduce motion', () => {
  it('System follows the OS; On/Off override', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('particle budget drops to 40% when reduced', () => {
    const full = new Particles(1), reduced = new Particles(CONFIG.fx.reducedFactor);
    for (let i = 0; i < 400; i++) { full.smoke(0, 0, true); reduced.smoke(0, 0, true); }
    expect(full.count).toBe(CONFIG.fx.maxParticles);
    expect(reduced.count).toBeLessThanOrEqual(Math.round(CONFIG.fx.maxParticles * CONFIG.fx.reducedFactor));
  });
});

describe('view', () => {
  it('uses uniform scale, caps dpr at 2 and keeps the craft inside the view', () => {
    for (const [w, h] of [[1280, 800], [400, 600], [860, 340]] as const) {
      const v = computeView(w, h, 3);
      expect(v.dpr).toBe(2);
      expect(v.cx).toBeGreaterThan(0);
      expect(v.cx).toBeLessThan(v.wv);
      expect(v.top).toBeLessThanOrEqual(0);
      expect(v.bottom).toBeGreaterThanOrEqual(CONFIG.world.height);
      expect(v.wv * v.s).toBeCloseTo(w, 5);
    }
  });
  it('zooms on narrow portrait so the cave fills most of the height', () => {
    const phone = computeView(400, 860, 2);
    expect(phone.wv).toBeCloseTo(CONFIG.view.minLogicalW, 5);
    expect(caveShare(phone)).toBeGreaterThanOrEqual(0.68);
    const land = computeView(860, 400, 2);
    expect(caveShare(land)).toBeCloseTo(1, 5);
    const desk = computeView(1280, 800, 2);
    expect(caveShare(desk)).toBeCloseTo(1, 5);
  });
});
