import { describe, expect, it } from 'vitest';
import { lerpMover } from '../src/movement';
import { createWorld } from '../src/world';
import { stepWorld } from '../src/step';
import { FIXED_DT } from '../src/types';

describe('render interpolation', () => {
  it('blends previous and current by alpha and clamps it', () => {
    const m = { x: 3, y: 2, px: 2, py: 2 };
    expect(lerpMover(m, 0)).toEqual({ x: 2, y: 2 });
    expect(lerpMover(m, 0.5)).toEqual({ x: 2.5, y: 2 });
    expect(lerpMover(m, 1)).toEqual({ x: 3, y: 2 });
    expect(lerpMover(m, 7)).toEqual({ x: 3, y: 2 });
    expect(lerpMover(m, -3)).toEqual({ x: 2, y: 2 });
  });

  it('never interpolates across a tunnel wrap or teleport', () => {
    expect(lerpMover({ x: 21, y: 11, px: -1, py: 11 }, 0.5)).toEqual({ x: 21, y: 11 });
    expect(lerpMover({ x: 3, y: 4, px: 3, py: 15 }, 0.5)).toEqual({ x: 3, y: 4 });
  });

  it('stepWorld records the previous tick position without changing the simulation', () => {
    const a = createWorld(1);
    a.pip.want = 'D';
    const y0 = a.pip.y;
    stepWorld(a, FIXED_DT);
    expect(a.pip.py).toBe(y0);
    expect(a.pip.y).toBeGreaterThan(y0);
    const b = createWorld(1);
    b.pip.want = 'D';
    for (let i = 0; i < 120; i++) { stepWorld(a, FIXED_DT); }
    for (let i = 0; i < 121; i++) { stepWorld(b, FIXED_DT); }
    expect(a.pip.y).toBeCloseTo(b.pip.y, 9);
  });
});
