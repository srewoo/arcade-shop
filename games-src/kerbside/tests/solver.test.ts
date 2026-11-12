import { describe, expect, it } from 'vitest';
import { makeCar } from '../src/car';
import { LEVELS } from '../src/levels';
import { arc, solve } from '../src/solver';

describe('solver proves every level is solvable with a safety margin', () => {
  for (const level of LEVELS) {
    it(`level ${level.id} (${level.name})`, () => {
      const plan = solve(level);
      expect(plan.found).toBe(true);
      expect(plan.moves.length).toBeGreaterThan(0);
      expect(plan.distance).toBeGreaterThan(5);
    }, 120_000);
  }
});

describe('solver primitives', () => {
  it('arc refuses to drive through an obstacle', () => {
    const level = LEVELS[0]!;
    const near = makeCar(level.start.x, 2.5, -Math.PI / 2);
    expect(arc(near, { steer: 0, dir: 1 }, 3, level, 0.1)).toBeUndefined();
    expect(arc(makeCar(level.start.x, 14, -Math.PI / 2), { steer: 0, dir: 1 }, 1, level, 0.1)).toBeDefined();
  });
  it('reports failure on an impossible level', () => {
    const level = LEVELS[0]!;
    const walled = { ...level, obstacles: [...level.obstacles, { box: { x: level.start.x, y: level.start.y, hw: 40, hh: 0.2, a: 0 }, kind: 'wall' as const, tint: 0 }] };
    const plan = solve({ ...walled, start: { ...level.start, y: level.world.h - 0.3 } });
    expect(plan.found).toBe(false);
  }, 60_000);
});
