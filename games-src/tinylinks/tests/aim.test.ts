import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { aimAt, aimFromDrag, nudgeAngle, nudgePower } from '../src/game/aim';
import { computeView, toWorld, vecToWorld, worldToScreen } from '../src/render/view';

describe('drag-back aiming', () => {
  it('shoots opposite to the drag and scales power with pull length', () => {
    const a = aimFromDrag(-100, 0, 100);
    expect(a?.angle).toBeCloseTo(0, 6);
    const b = aimFromDrag(0, 80, 80);
    expect(b?.angle).toBeCloseTo((3 * Math.PI) / 2, 6);
    expect((aimFromDrag(-60, 0, 60)?.power ?? 0)).toBeLessThan(aimFromDrag(-120, 0, 120)?.power ?? 0);
  });
  it('cancels inside the dead zone and caps at full power', () => {
    expect(aimFromDrag(-5, 0, 5)).toBeNull();
    expect(aimFromDrag(0, 0, 0)).toBeNull();
    expect(aimFromDrag(-9999, 0, 9999)?.power).toBe(1);
  });
  it('keyboard nudges wrap and clamp', () => {
    const a = { angle: 0, power: 0.5 };
    expect(nudgeAngle(a, -1, false).angle).toBeCloseTo(2 * Math.PI - CONFIG.aim.keyAngleStep, 6);
    expect(nudgeAngle(a, 1, true).angle).toBeCloseTo(CONFIG.aim.keyAngleFine, 6);
    expect(nudgePower({ angle: 0, power: 1 }, 1, false).power).toBe(1);
    expect(nudgePower({ angle: 0, power: 0 }, -1, false).power).toBe(0);
    expect(nudgePower(a, 1, false).power).toBeCloseTo(0.55, 6);
  });
  it('aimAt points at the target', () => {
    expect(aimAt({ x: 0, y: 0 }, { x: 0, y: 10 }).angle).toBeCloseTo(Math.PI / 2, 6);
  });
});

describe('view transforms', () => {
  it.each([[1280, 800], [400, 860], [860, 400]])('round-trips world <-> screen at %ix%i', (w, h) => {
    const v = computeView(w, h, 1);
    const s = worldToScreen(v, 123, 321);
    const back = toWorld(v, s.x, s.y);
    expect(back.x).toBeCloseTo(123, 6);
    expect(back.y).toBeCloseTo(321, 6);
  });
  it('rotates portrait screens and keeps drag directions consistent', () => {
    const v = computeView(400, 860, 1);
    expect(v.rot).toBe(true);
    const a = worldToScreen(v, 100, 250);
    const b = worldToScreen(v, 200, 250);
    const d = vecToWorld(v, b.x - a.x, b.y - a.y);
    expect(d.x).toBeGreaterThan(0);
    expect(Math.abs(d.y)).toBeLessThan(1e-6);
    expect(computeView(1280, 800, 1).rot).toBe(false);
  });
  it('fits the course inside the screen', () => {
    for (const [w, h] of [[1280, 800], [400, 860], [860, 400], [360, 640]] as const) {
      const v = computeView(w, h, 2);
      for (const [x, y] of [[60, 60], [740, 440]] as const) {
        const p = worldToScreen(v, x, y);
        expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(w);
        expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(h);
      }
      expect(v.dpr).toBeLessThanOrEqual(2);
    }
  });
});
