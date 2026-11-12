// Spawn table / difficulty curve (pure).  The original curve is kept verbatim; the new obstacles fade in gradually
// after their start distance (weight ramps from 0 to full over RAMP metres).
import { TUNING } from '../config.js';
import { GATES } from '../tuning.js';

export const NEW_OBSTACLES = {
  boulder: { after: 250, weight: 1.6 },
  log: { after: 340, weight: 1.4 },
  meteor: { after: 480, weight: 1.0 },
};
export const RAMP = 250; // metres over which a new obstacle reaches full weight

/** Weight multiplier 0..1 of a new obstacle at `distance`. */
export const rampFactor = (distance, after, ramp = RAMP) => Math.min(1, Math.max(0, (distance - after) / ramp));

/**
 * Metres run after `t` seconds at a mode's speed profile ({start, max, accel}: start speed, top speed, m/s^2).
 * Speed rises linearly to `max`, then stays there.
 */
export function distanceAtTime(t, { start, max, accel }) {
  const tMax = accel > 0 ? Math.max(0, (max - start) / accel) : 0;
  const ramp = Math.min(t, tMax);
  return start * ramp + 0.5 * accel * ramp * ramp + max * Math.max(0, t - tMax);
}

/** Time-based gates (tuning.js GATES) turned into distance gates for one mode / difficulty speed profile. */
export function obstacleGates(kin) {
  const ramp = distanceAtTime(GATES.rampS, kin);
  const gates = { ramp };
  for (const kind of ['boulder', 'log', 'meteor']) gates[kind] = { after: distanceAtTime(GATES[kind].atS, kin), weight: GATES[kind].weight };
  return gates;
}

/** Is the n-th (1-based) breather, a guaranteed longer gap every GATES.breatherEveryS of play, due at `distance`? */
export const breatherDue = (distance, n, kin) => distance >= distanceAtTime(GATES.breatherEveryS * n, kin);

/**
 * @param gates optional per-mode gates from obstacleGates(); omitted = the legacy distance gates (NEW_OBSTACLES, RAMP)
 * @returns {[string, number][]} [kind, weight] pairs for the weighted pick at `distance` metres.
 */
export function spawnTable(distance, { newObstacles = false, gates = null } = {}) {
  const table = [['cactusS', 2], ['cactusL', 2]];
  if (distance > TUNING.groupsAfter) table.push(['group2', 2.2], ['group3', 1.2]);
  if (distance > TUNING.weedsAfter) table.push(['weed', 1.3]);
  if (distance > TUNING.pterosAfter) table.push(['pteroLow', 0.9], ['pteroMid', 1.5], ['pteroHigh', 0.7]);
  if (newObstacles) {
    for (const [kind, { after, weight }] of Object.entries(gates ?? NEW_OBSTACLES)) {
      if (kind === 'ramp') continue;
      const w = weight * rampFactor(distance, after, gates?.ramp ?? RAMP);
      if (w > 0) table.push([kind, w]);
    }
  }
  return table;
}
