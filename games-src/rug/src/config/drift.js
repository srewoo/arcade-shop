// Drift scoring and mini-turbo tuning (moved unchanged from logic/drift.js).
export const MIN_DRIFT_TIME = 0.25; // shorter slides never count as a drift release
export const COMBO_WINDOW = 1.5; // seconds after a release before points are banked
export const POINTS_PER_SECOND = 60; // at reference speed and zero duration
export const REFERENCE_SPEED = 37;
export const DURATION_GROWTH = 0.8; // +80 % rate per second of drift
export const COMBO_STEP = 0.5; // +50 % per chained drift

/**
 * Mini-turbo tiers: minT = drift seconds needed; impulse = instant speed gain; thrust/dur = push after.
 * `short` is the one-word name shown beside the score so the tier is not carried by colour alone.
 */
export const TIERS = Object.freeze([
  { tier: 0, minT: 0, color: "#ffe9a8", label: "", short: "" },
  { tier: 1, minT: 1, color: "#4aa8ff", label: "MINI TURBO", short: "MINI", impulse: 4, thrust: 26, dur: 0.6 },
  { tier: 2, minT: 2, color: "#ff8a1a", label: "MINI TURBO 2", short: "SUPER", impulse: 7, thrust: 38, dur: 1 },
]);
