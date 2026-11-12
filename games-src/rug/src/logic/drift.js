// Drift scoring and mini-turbo tiers. Pure (no three, no DOM).
//
// A drift is a continuous stretch with the car's `drifting` flag set.  Points accrue while drifting
// (faster with speed and with drift duration), chain into a combo if the next drift starts within
// COMBO_WINDOW seconds, are banked once the window expires and are lost on a hit.
// Releasing a drift after >= 1 s / >= 2 s gives a mini-turbo (tier 1 / tier 2).

import { MIN_DRIFT_TIME, COMBO_WINDOW, POINTS_PER_SECOND, REFERENCE_SPEED, DURATION_GROWTH, COMBO_STEP, TIERS } from "../config/drift.js";

export { MIN_DRIFT_TIME, COMBO_WINDOW, POINTS_PER_SECOND, REFERENCE_SPEED, DURATION_GROWTH, COMBO_STEP, TIERS };

/** Tier (0, 1 or 2) earned by a drift of `seconds`. */
export function tierForDuration(seconds) {
  let tier = 0;
  for (const t of TIERS) if (seconds >= t.minT) tier = t.tier;
  return tier;
}

/** Spark colour while a drift has lasted `seconds`. */
export const sparkColor = (seconds) => TIERS[tierForDuration(seconds)].color;

/** Points per second for a drift of `duration` seconds at `speed`. */
export const driftPointRate = (speed, duration) =>
  POINTS_PER_SECOND * (Math.max(0, speed) / REFERENCE_SPEED) * (1 + DURATION_GROWTH * Math.max(0, duration));

/** Forward-speed gain from the release impulse, never pushing past `topSpeed`. */
export function turboImpulse(tier, forwardSpeed, topSpeed) {
  const t = TIERS[tier];
  return t?.impulse ? Math.max(0, Math.min(t.impulse, topSpeed - forwardSpeed)) : 0;
}

/** Forward-speed gain this step from the sustained mini-turbo push, never pushing past `topSpeed`. */
export function turboThrust(tier, dt, forwardSpeed, topSpeed) {
  const t = TIERS[tier];
  return t?.thrust ? Math.max(0, Math.min(t.thrust * dt, topSpeed - forwardSpeed)) : 0;
}

export class DriftScorer {
  constructor() {
    this.active = false;
    this.duration = 0; // seconds of the current drift
    this.pending = 0; // points not yet banked
    this.combo = 0; // chained drifts in this chain
    this.idle = 0; // seconds since the last release
    this.total = 0; // banked score
    this.tier = 0; // tier of the current drift (0 while not drifting)
  }

  /**
   * Advance by dt.  Returns events: {type:"tier",tier} (tier reached while drifting),
   * {type:"release",tier,duration,points} and {type:"bank",points,combo}.
   */
  update(dt, { drifting, speed }) {
    const events = [];
    if (drifting) {
      if (!this.active) {
        this.active = true;
        this.duration = 0;
        this.combo = this.pending > 0 ? this.combo + 1 : 1;
      }
      this.duration += dt;
      const mult = 1 + COMBO_STEP * (this.combo - 1);
      this.pending += driftPointRate(speed, this.duration) * mult * dt;
      const tier = tierForDuration(this.duration);
      if (tier > this.tier) events.push({ type: "tier", tier });
      this.tier = tier;
      return events;
    }
    if (this.active) {
      this.active = false;
      this.idle = 0;
      if (this.duration >= MIN_DRIFT_TIME) {
        events.push({ type: "release", tier: this.tier, duration: this.duration, points: Math.round(this.pending) });
      }
      this.duration = 0;
      this.tier = 0;
    }
    if (this.pending > 0) {
      this.idle += dt;
      if (this.idle >= COMBO_WINDOW) {
        const points = Math.round(this.pending);
        this.total += points;
        events.push({ type: "bank", points, combo: this.combo });
        this.pending = 0;
        this.combo = 0;
      }
    }
    return events;
  }

  /** A wall/car hit: everything not yet banked is lost. Returns {type:"lost",points} or null. */
  hit() {
    if (!this.active && this.pending <= 0) return null;
    const points = Math.round(this.pending);
    this.pending = 0;
    this.combo = 0;
    this.duration = 0;
    this.tier = 0;
    this.idle = 0;
    return { type: "lost", points };
  }
}
