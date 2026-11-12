// Bronze / silver / gold from a finish time against a par time. Pure.
import { MEDAL_MULTIPLIERS } from "../config/medals.js";

export const MEDALS = Object.freeze(["bronze", "silver", "gold"]);

/** Par time in ms for `laps` laps from a per-lap par in seconds, or null when unknown. */
export function parMs(parLapSeconds, laps) {
  return Number.isFinite(parLapSeconds) && parLapSeconds > 0 && laps > 0 ? Math.round(parLapSeconds * laps * 1000) : null;
}

/** Best medal earned by `ms` against `par` (ms), or null. */
export function medalFor(ms, par, multipliers = MEDAL_MULTIPLIERS) {
  if (!Number.isFinite(ms) || ms <= 0 || !par) return null;
  if (ms <= par * multipliers.gold) return "gold";
  if (ms <= par * multipliers.silver) return "silver";
  if (ms <= par * multipliers.bronze) return "bronze";
  return null;
}

/** Target times in ms per medal for a par, in the order gold, silver, bronze. */
export const medalTargets = (par, multipliers = MEDAL_MULTIPLIERS) =>
  par ? { gold: Math.round(par * multipliers.gold), silver: Math.round(par * multipliers.silver), bronze: Math.round(par * multipliers.bronze) } : null;

/** Stars (1-3) are the non-colour cue for a medal. */
export const medalStars = (medal) => (medal === "gold" ? 3 : medal === "silver" ? 2 : medal === "bronze" ? 1 : 0);
