import { describe, expect, it } from 'vitest';
import { createFx, explosion, fxUpdate } from '../src/fx';

describe('explosion fx', () => {
  it('spawns fire, sparks and smoke plus a filled fireball ring', () => {
    const fx = createFx();
    explosion(fx, 100, 100, 1, false);
    const kinds = new Set(fx.particles.map((p) => p.kind));
    expect(kinds).toEqual(new Set([0, 1, 2]));
    expect(fx.rings.some((r) => r.fill)).toBe(true);
  });

  it('reduce motion cuts particles and skips rings', () => {
    const a = createFx();
    const b = createFx();
    explosion(a, 0, 0, 2, false);
    explosion(b, 0, 0, 2, true);
    expect(b.particles.length).toBeLessThan(a.particles.length * 0.6);
    expect(b.rings).toHaveLength(0);
  });

  it('particles expire and never exceed the cap', () => {
    const fx = createFx();
    for (let i = 0; i < 40; i++) explosion(fx, 0, 0, 3, false);
    expect(fx.particles.length).toBeLessThanOrEqual(300);
    fxUpdate(fx, 2);
    expect(fx.particles).toHaveLength(0);
  });
});
