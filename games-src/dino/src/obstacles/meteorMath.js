// Meteor timing (pure).  The whole sequence is a function of "time until the player arrives", so it is stateless
// and always leaves the player IMPACT_LEAD seconds to react to the landed rock.
export const WARN_TIME = 3.2; // ground marker appears this long before the player arrives
export const IMPACT_LEAD = 1.3; // the rock has landed this long before the player arrives
export const FALL_TIME = 1.4; // flight time
export const FALL_HEIGHT = 70;

/** Seconds until the player reaches `meteorZ` (player runs toward -z); Infinity when it is behind. */
export const timeToArrival = (playerZ, meteorZ, speed) => (playerZ >= meteorZ ? (playerZ - meteorZ) / Math.max(speed, 1) : Infinity);

/** @returns {{marker:boolean, falling:boolean, landed:boolean, altitude:number, urgency:number}} */
export function meteorPhase(tta) {
  const toImpact = tta - IMPACT_LEAD;
  if (toImpact <= 0) return { marker: true, falling: false, landed: true, altitude: 0, urgency: 1 };
  if (tta > WARN_TIME) return { marker: false, falling: false, landed: false, altitude: FALL_HEIGHT, urgency: 0 };
  const t = Math.min(1, toImpact / FALL_TIME);
  return { marker: true, falling: toImpact <= FALL_TIME, landed: false, altitude: FALL_HEIGHT * t * t, urgency: 1 - toImpact / (WARN_TIME - IMPACT_LEAD) };
}
