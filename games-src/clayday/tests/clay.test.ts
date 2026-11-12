import { describe, expect, it } from 'vitest';
import { clayPoint, clayRadius, clayVelocity, landingAge, launchClay, pathInBounds, stepClay, type ClaySpec } from '../src/clay';
import { WORLD } from './helpers';

const spec: ClaySpec = { side: 'L', delay: 0, flight: 2.2, apex: 0.5, range: 0.6, kind: 'std' };

describe('clay flight', () => {
  it('starts at the house roof and returns to roof height after the flight time', () => {
    const a = clayPoint(spec, WORLD, 0, 0);
    const b = clayPoint(spec, WORLD, 0, spec.flight);
    expect(a.y).toBeCloseTo(WORLD.launchY);
    expect(b.y).toBeCloseTo(WORLD.launchY);
    expect(b.x - a.x).toBeCloseTo(0.6 * WORLD.w);
  });
  it('peaks at apex * arc above the roof at mid flight', () => {
    expect(WORLD.launchY - clayPoint(spec, WORLD, 0, spec.flight / 2).y).toBeCloseTo(0.5 * WORLD.arc);
  });
  it('right-hand houses throw leftwards', () => {
    const r = { ...spec, side: 'R' as const };
    expect(clayPoint(r, WORLD, 0, 1).x).toBeLessThan(clayPoint(r, WORLD, 0, 0).x);
  });
  it('wind pushes the clay sideways (+ is right)', () => {
    const calm = clayPoint(spec, WORLD, 0, 2).x;
    expect(clayPoint(spec, WORLD, 0.05, 2).x).toBeGreaterThan(calm);
    expect(clayPoint(spec, WORLD, -0.05, 2).x).toBeLessThan(calm);
  });
  it('velocity matches the numerical derivative', () => {
    const h = 1e-4;
    const p0 = clayPoint(spec, WORLD, 0.03, 1);
    const p1 = clayPoint(spec, WORLD, 0.03, 1 + h);
    const v = clayVelocity(spec, WORLD, 0.03, 1);
    expect((p1.x - p0.x) / h).toBeCloseTo(v.x, 1);
    expect((p1.y - p0.y) / h).toBeCloseTo(v.y, 1);
  });
  it('lands at ground level after landingAge', () => {
    const age = landingAge(spec, WORLD);
    expect(age).toBeGreaterThan(spec.flight);
    expect(clayPoint(spec, WORLD, 0, age).y).toBeCloseTo(WORLD.groundY, 3);
  });
  it('minis are smaller than standard clays', () => {
    expect(clayRadius('mini')).toBeLessThan(clayRadius('std'));
    expect(clayRadius('gold')).toBe(clayRadius('std'));
  });
  it('stepClay tracks previous position for interpolation', () => {
    const c = launchClay(0, 0, spec, WORLD, 0);
    stepClay(c, WORLD, 0.1);
    expect(c.px).toBeCloseTo(clayPoint(spec, WORLD, 0, 0).x);
    expect(c.x).toBeCloseTo(clayPoint(spec, WORLD, 0, 0.1).x);
    expect(c.state).toBe('flying');
  });
  it('pathInBounds rejects clays that leave the field', () => {
    expect(pathInBounds(spec, WORLD, 0)).toBe(true);
    expect(pathInBounds({ ...spec, range: 2 }, WORLD, 0)).toBe(false);
    expect(pathInBounds(spec, WORLD, -0.3)).toBe(false);
  });
});
