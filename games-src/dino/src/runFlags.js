// Per-run bookkeeping that only drives feedback (warning ticks, coaching, hint auto-hide).  Never read by the simulation.
import { POWERUP_IDS } from './powerups.js';

export const hintFlags = {
  hintsHidden: false,
  clockSec: -1, // last whole second announced on the Time Attack clock
  warnSec: Object.fromEntries(POWERUP_IDS.map((id) => [id, -1])), // last whole second warned per power-up
  reset() {
    this.hintsHidden = false;
    this.clockSec = -1;
    for (const id of POWERUP_IDS) this.warnSec[id] = -1;
  },
};

/** Seconds on the Time Attack clock that get a warning tick. */
export const CLOCK_WARN_SECONDS = Object.freeze([10, 5, 3, 2, 1]);
