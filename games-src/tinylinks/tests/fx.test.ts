import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { FixedStepper } from '../src/loop';
import { Particles } from '../src/render/particles';

describe('Particles', () => {
  it('stays inside the pool and expires', () => {
    const p = new Particles();
    p.burst('confetti', 0, 0, 5000, 100, ['#fff'], false);
    p.update(0.016);
    expect(p.count).toBeLessThanOrEqual(CONFIG.fx.maxParticles);
    for (let i = 0; i < 200; i++) p.update(0.05);
    expect(p.count).toBe(0);
  });
  it('reduced motion spawns at most ~40%', () => {
    const full = new Particles();
    const calm = new Particles();
    full.burst('drop', 0, 0, 40, 50, ['#fff'], false);
    calm.burst('drop', 0, 0, 40, 50, ['#fff'], true);
    full.update(0.001); calm.update(0.001);
    expect(calm.count).toBeLessThanOrEqual(Math.ceil(full.count * CONFIG.fx.reducedFactor) + 1);
    expect(calm.count).toBeGreaterThan(0);
  });
});

describe('FixedStepper', () => {
  it('runs whole steps, exposes alpha and caps spiral-of-death frames', () => {
    const s = new FixedStepper(0.01, 0.25, 8);
    let n = 0;
    expect(s.advance(0.035, () => { n++; })).toBe(3);
    expect(s.alpha).toBeCloseTo(0.5, 5);
    expect(s.advance(10, () => { n++; })).toBe(8);
    expect(n).toBe(11);
    s.reset();
    expect(s.alpha).toBe(0);
  });
});
