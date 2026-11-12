// Attract mode: a self-flying demo behind the title card (no run exists yet).
import type { World } from '../world';

export const ATTRACT_SEED = 'updraft-attract-v1';
const START_X = 500;
const SPEED = 110;

/** World x of the craft. Frozen under reduced motion so nothing scrolls. */
export const attractDist = (time: number, reduced: boolean): number => START_X + (reduced ? 0 : time * SPEED);

/** Craft y: centred in the free span, gently weaving unless motion is reduced. Always inside the span. */
export function attractY(world: World, x: number, time: number, reduced: boolean): number {
  const [lo, hi] = world.freeSpan(x);
  const mid = (lo + hi) / 2;
  const sway = reduced ? 0 : Math.sin(time * 1.4) * (hi - lo) * 0.12;
  return mid + sway;
}
