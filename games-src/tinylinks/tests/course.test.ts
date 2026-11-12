import { describe, expect, it } from 'vitest';
import { ALL_HOLES, coursePar, holesFor } from '../src/course';
import { FRONT_NINE } from '../src/course/front9';
import { BACK_NINE } from '../src/course/back9';
import { validateHole } from '../src/course/validate';
import { solveHole } from '../src/physics/solver';

describe('course layout', () => {
  it('has 18 holes split 9 / 9 with unique ids 1..18', () => {
    expect(FRONT_NINE).toHaveLength(9);
    expect(BACK_NINE).toHaveLength(9);
    expect(ALL_HOLES.map((h) => h.id)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(holesFor('all18')).toHaveLength(18);
    expect(coursePar('front9') + coursePar('back9')).toBe(coursePar('all18'));
  });
  it('introduces moving obstacles only on the back half (plus one gate on 9)', () => {
    expect(ALL_HOLES.filter((h) => h.movers?.length).map((h) => h.id)).toEqual([9, 14, 15, 18]);
  });
});

describe.each(ALL_HOLES)('hole $id $name', (hole) => {
  it('passes validity checks (tee clear of walls, cup reachable)', () => {
    expect(validateHole(hole)).toEqual([]);
  });
  it('can be holed out by the physics bot within par + 4', () => {
    const sol = solveHole(hole);
    expect(sol).not.toBeNull();
    expect(sol?.strokes ?? 99).toBeLessThanOrEqual(hole.par + 4);
  }, 120_000);
});
