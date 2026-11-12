import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { isReducedMotion } from '../src/ui/appearance';
import { Effects } from '../src/render/fx';
import { computeView, toWorld } from '../src/render/view';

describe('reduce motion', () => {
  it('System follows the OS; On/Off override', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
  it('particle budget drops to 40% and shake is removed', () => {
    const full = new Effects(); const reduced = new Effects(); reduced.factor = CONFIG.fx.reducedFactor;
    for (let i = 0; i < 80; i++) { full.land(100); reduced.land(100); }
    expect(full.count).toBe(CONFIG.fx.maxParticles);
    expect(reduced.count).toBeLessThanOrEqual(Math.round(CONFIG.fx.maxParticles * CONFIG.fx.reducedFactor));
    expect(full.shakeOffset(0.3).x !== 0 || full.shakeOffset(0.3).y !== 0).toBe(true);
    expect(reduced.shakeOffset(0.3)).toEqual({ x: 0, y: 0 });
  });
});

describe('view', () => {
  it('caps dpr at 2, keeps the playfield within 360..960 and covers the canvas', () => {
    for (const [w, h] of [[1280, 800], [400, 860], [860, 400], [1920, 1080]] as const) {
      const v = computeView(w, h, 3);
      expect(v.dpr).toBe(2);
      expect(v.worldW).toBeGreaterThanOrEqual(Math.min(v.wv, CONFIG.world.minWidth) - 1e-9);
      expect(v.worldW).toBeLessThanOrEqual(CONFIG.world.maxWidth);
      expect(v.wv * v.s).toBeCloseTo(w, 5);
      expect(v.top).toBeLessThanOrEqual(0);
      expect(v.bottom).toBeGreaterThanOrEqual(CONFIG.world.height);
      expect(v.ox).toBeGreaterThanOrEqual(0);
    }
  });
  it('maps pointer positions to world coordinates and back', () => {
    const v = computeView(1920, 1080, 1);
    const p = toWorld(v, (v.ox + 100) * v.s, (300 - v.top) * v.s);
    expect(p.x).toBeCloseTo(100, 6);
    expect(p.y).toBeCloseTo(300, 6);
  });
  it('the ground stays on screen in portrait phones', () => {
    const v = computeView(400, 860, 2);
    expect(v.bottom).toBeGreaterThan(CONFIG.world.groundY);
    expect(v.s * CONFIG.world.minWidth).toBeLessThanOrEqual(400 + 1e-9);
  });
});
