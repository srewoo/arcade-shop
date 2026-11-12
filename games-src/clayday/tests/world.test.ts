import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { clampToWorld, clientToWorld, fitWorld, makeWorld, worldForStage, worldToClient } from '../src/world';

describe('world sizing', () => {
  it('desktop stages get the wide world, phones the narrow tall one', () => {
    const desk = worldForStage(1240, 700);
    const phone = worldForStage(370, 620);
    expect(desk.w).toBe(CONFIG.world.maxW);
    expect(phone.w).toBeLessThan(desk.w);
    expect(phone.h / phone.w).toBeGreaterThan(desk.h / desk.w);
  });
  it('always stays inside the configured bounds, even for silly stages', () => {
    for (const [w, h] of [[0, 0], [1, 5000], [5000, 1], [320, 568], [860, 380], [1920, 1000]] as const) {
      const world = worldForStage(w, h);
      expect(world.w).toBeGreaterThanOrEqual(CONFIG.world.minW);
      expect(world.w).toBeLessThanOrEqual(CONFIG.world.maxW);
      expect(world.h).toBeGreaterThanOrEqual(CONFIG.world.minH);
      expect(world.h).toBeLessThanOrEqual(CONFIG.world.maxH);
      expect(world.groundY).toBeGreaterThan(world.launchY);
      expect(world.groundY).toBeLessThan(world.h);
    }
  });
  it('fit centres the world and maps points both ways', () => {
    const world = makeWorld(1000, 600);
    const fit = fitWorld(world, 800, 800);
    expect(fit.scale).toBeCloseTo(0.8);
    expect(fit.ox).toBeCloseTo(0);
    expect(fit.oy).toBeCloseTo(160);
    const c = worldToClient(fit, 500, 300);
    expect(c.x).toBeCloseTo(400);
    expect(c.y).toBeCloseTo(400);
    const back = clientToWorld(fit, c.x, c.y);
    expect(back.x).toBeCloseTo(500);
    expect(back.y).toBeCloseTo(300);
  });
  it('clamps aim points into the world', () => {
    const world = makeWorld(1000, 600);
    expect(clampToWorld(world, -5, 9999)).toEqual({ x: 0, y: 600 });
  });
});
