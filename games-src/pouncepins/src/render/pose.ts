// Cartoon pose of a cat from sim state (pure, so it is unit-testable).
import { CONFIG } from '../config';
import type { Cat } from '../worldTypes';

const { cat: C } = CONFIG;

export type PoseName = 'stand' | 'wobble' | 'leap' | 'tumble' | 'landed' | 'cushion' | 'gone';

export interface Pose {
  readonly name: PoseName;
  /** Height above the floor in sprite units. */
  readonly z: number;
  /** Rotation in radians around the cat's middle. */
  readonly rot: number;
  /** Seconds since landing (landed/cushion poses) else 0. */
  readonly sinceLand: number;
}

const wrap = (a: number): number => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

export function catPose(c: Cat): Pose {
  if (c.gone) return { name: 'gone', z: 0, rot: 0, sinceLand: 0 };
  if (c.mode === 'jump') return { name: 'leap', z: 46 * Math.sin((Math.PI * c.t) / C.jumpTime), rot: 0, sinceLand: 0 };
  if (c.mode === 'wobble') return { name: 'wobble', z: 0, rot: Math.sin(c.t * 22) * (0.1 + 0.5 * (c.t / C.wobbleTime)), sinceLand: 0 };
  if (!c.hit) return { name: 'stand', z: 0, rot: 0, sinceLand: 0 };
  if (c.settled) {
    const since = Math.max(0, c.t - c.landT);
    const rot = wrap(c.spin * 4 * Math.PI * (1 - Math.exp(-3.5 * c.landT))) * Math.exp(-since * 18);
    return { name: c.cushion ? 'cushion' : 'landed', z: 0, rot, sinceLand: since };
  }
  const z = 34 * Math.abs(Math.sin((Math.PI * c.t) / C.hopPeriod)) * Math.exp(-1.4 * c.t);
  return { name: 'tumble', z, rot: c.spin * 4 * Math.PI * (1 - Math.exp(-3.5 * c.t)), sinceLand: 0 };
}
