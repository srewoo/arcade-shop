import { poly } from '../src/course/helpers';
import type { HoleDef } from '../src/physics/types';

/** A plain 680x300 box with tee on the left and cup on the right. */
export function box(extra: Partial<HoleDef> = {}): HoleDef {
  return { id: 99, name: 'test', par: 3, tee: { x: 100, y: 250 }, cup: { x: 700, y: 250 }, walls: [poly(60, 100, 740, 100, 740, 400, 60, 400)], ...extra };
}
