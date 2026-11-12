// Per-model car tuning: multipliers around today's physics values. Pure.
// top = top speed, accel = acceleration, grip = lateral grip (low = slidey), boost = tank efficiency
// (drain is divided by it; drift recharge is multiplied by it).

export const STAT_KEYS = ["top", "accel", "grip", "boost"];
export const STAT_LABELS = { top: "Top speed", accel: "Accel", grip: "Grip", boost: "Boost" };

export const NEUTRAL_TUNE = Object.freeze({ top: 1, accel: 1, grip: 1, boost: 1 });

/** Eight models (4 classic + 4 lego), each a different trade-off; the Classic Coupe is the baseline. */
export const CAR_TUNING = Object.freeze({
  classic: [
    { top: 1, accel: 1, grip: 1, boost: 1, blurb: "Balanced all-rounder" },
    { top: 0.96, accel: 0.94, grip: 1.06, boost: 1.1, blurb: "Tough and grippy" },
    { top: 0.92, accel: 0.9, grip: 1.1, boost: 1.15, blurb: "Slow, stable, long boost" },
    { top: 1.06, accel: 1.07, grip: 0.9, boost: 0.92, blurb: "Fast but twitchy" },
  ],
  lego: [
    { top: 1.02, accel: 1.04, grip: 0.96, boost: 0.98, blurb: "Punchy off the line" },
    { top: 0.98, accel: 0.96, grip: 1.08, boost: 1.04, blurb: "Sure-footed hauler" },
    { top: 0.94, accel: 0.92, grip: 1.12, boost: 1.1, blurb: "Brick wall with grip" },
    { top: 1.08, accel: 1.05, grip: 0.88, boost: 0.95, blurb: "Top-end rocket, slides" },
  ],
});

/** Tuning for a kind ("classic" | "lego") and model index 0-3; anything invalid is neutral. */
export function tuneFor(kind, model) {
  const entry = CAR_TUNING[kind]?.[model];
  return entry ? { top: entry.top, accel: entry.accel, grip: entry.grip, boost: entry.boost } : NEUTRAL_TUNE;
}

export const blurbFor = (kind, model) => CAR_TUNING[kind]?.[model]?.blurb ?? "";

const BAR_MIN = 0.85;
const BAR_MAX = 1.15;

/** Bar fill 0..100 for a multiplier (1.0 sits in the middle). */
export const barPercent = (value) => Math.round(Math.max(0, Math.min(1, (value - BAR_MIN) / (BAR_MAX - BAR_MIN))) * 100);

/** Rows for the garage bars. */
export function statBars(tune) {
  return STAT_KEYS.map((key) => ({
    key,
    label: STAT_LABELS[key],
    value: tune[key],
    percent: barPercent(tune[key]),
    delta: Math.round((tune[key] - 1) * 100),
  }));
}
