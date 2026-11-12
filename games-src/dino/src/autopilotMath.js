// Ballistic helpers for the autopilot's Double Jump decisions (pure, unit-tested).
import { TUNING } from './config.js';
import { AIR_JUMP_POWER } from './powerups.js';

const STEP = 0.02;
export const BODY_CLEARANCE = 0.45; // dino body box bottom sits this far above its feet while airborne
export const CLEAR_MARGIN = 0.1;

/** Lowest height of the dino over [t0, t1] seconds from now, starting at height y with vertical speed vy (lands at 0). */
export function minHeightOver(y, vy, t0, t1, gravity = TUNING.gravity) {
  let h = y, v = vy, min = Infinity;
  for (let t = 0; t <= t1 + 1e-9; t += STEP) {
    if (t >= t0) min = Math.min(min, h);
    v -= gravity * STEP;
    h = Math.max(0, h + v * STEP);
  }
  return min;
}

/** Does a jump state clear an obstacle of top `y1` while it overlaps the body during [t0, t1]? */
export const clears = (y, vy, t0, t1, y1) => minHeightOver(y, vy, Math.max(0, t0), Math.max(t1, 0)) + BODY_CLEARANCE >= y1 + CLEAR_MARGIN;

/**
 * Decide whether to spend the air jump now.  Jump at the last moment that still clears: when the current arc
 * fails, a jump right now would clear, but waiting one more step would not (or there is no time left to wait).
 */
export function shouldAirJump({ y, vy, t0, t1, y1, wait = 0.05 }) {
  if (clears(y, vy, t0, t1, y1)) return false;
  const boost = TUNING.jumpVel * AIR_JUMP_POWER;
  if (!clears(y, boost, t0, t1, y1)) return y > 0.4 && vy < 0; // hopeless: still try once we are falling
  // after `wait` seconds of free flight the arc has moved on; would a jump then still clear?
  const yLater = Math.max(0, y + vy * wait - 0.5 * TUNING.gravity * wait * wait);
  return !clears(yLater, boost, t0 - wait, t1 - wait, y1);
}
