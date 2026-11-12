// Velocity-tracking autopilot: aims for the middle of the free span ahead. Used by the
// level-validation tests and the ?debug=1 hook, never by normal play.
import type { SimState } from './sim';
import type { World } from './world';

export function botHold(world: World, s: SimState, look = 75, kp = 5, vmax = 250): boolean {
  const [lo, hi] = world.freeSpan(s.dist + look);
  const want = Math.max(-vmax, Math.min(vmax, ((lo + hi) / 2 - s.y) * kp));
  return s.vy > want;
}
