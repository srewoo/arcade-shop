import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/config';
import { computeLayout, coverage, STACK_BOTTOM, STACK_TOP, toWorld } from '../src/layout';

describe('computeLayout', () => {
  it('desktop 1280x800 uses side mode with the lane fitted to the full height', () => {
    const l = computeLayout(1280, 800);
    expect(l.mode).toBe('side');
    expect(l.h).toBeCloseTo(800, 5);
    expect(l.w / l.h).toBeCloseTo(WORLD.w / WORLD.h, 5);
    expect(l.x + l.w / 2).toBeCloseTo(640, 5);
    expect(l.zone).toBeGreaterThan(200);
  });
  it('landscape phone 860x400 keeps HUD zones either side', () => {
    const l = computeLayout(860, 400);
    expect(l.mode).toBe('side');
    expect(l.y).toBe(0);
    expect(l.x).toBeGreaterThan(l.zone);
  });
  it('portrait phone 400x860 stacks: lane clear of the HUD strip and bomb dock', () => {
    const l = computeLayout(400, 860);
    expect(l.mode).toBe('stack');
    expect(l.y).toBeGreaterThanOrEqual(STACK_TOP);
    expect(860 - (l.y + l.h)).toBeGreaterThanOrEqual(STACK_BOTTOM);
    expect(l.w).toBeGreaterThan(360);
  });
  it('respects safe-area insets', () => {
    const l = computeLayout(400, 860, { top: 40, bottom: 30, left: 0, right: 0 });
    expect(l.y).toBeGreaterThanOrEqual(40 + STACK_TOP);
    expect(l.y + l.h).toBeLessThanOrEqual(860 - 30 - STACK_BOTTOM + 0.01);
  });
  it('never produces a zero or negative lane, even in a tiny window', () => {
    const l = computeLayout(10, 10);
    expect(l.scale).toBeGreaterThan(0);
    expect(l.w).toBeGreaterThan(0);
  });
  it('the canvas is full-bleed and the lane covers a measurable share', () => {
    const l = computeLayout(400, 860);
    const c = coverage(l, 400, 860);
    expect(c.canvas).toBe(1);
    expect(c.lane).toBeGreaterThan(0.8);
  });
});

describe('toWorld', () => {
  it('maps the lane corners to world corners', () => {
    const l = computeLayout(1280, 800);
    expect(toWorld(l.x, l.y, 0, 0, l)).toEqual({ x: 0, y: 0 });
    const br = toWorld(l.x + l.w, l.y + l.h, 0, 0, l);
    expect(br.x).toBeCloseTo(WORLD.w, 5);
    expect(br.y).toBeCloseTo(WORLD.h, 5);
  });
  it('accounts for the canvas offset on the page', () => {
    const l = { x: 100, y: 20, scale: 2 };
    expect(toWorld(150, 60, 10, 10, l)).toEqual({ x: 20, y: 15 });
  });
});
