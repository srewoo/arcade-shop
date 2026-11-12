// AI difficulty: scales the AI_PROFILES top speed / lateral budget and the rubber-band strength.
// Pure. "normal" multiplies by exactly 1, so the original AI (and the deterministic sim) is untouched.

import { DIFFICULTY, MAX_OPPONENTS } from "../config/ai.js";

export { DIFFICULTY, MAX_OPPONENTS };

/** @returns {{top:number,aLat:number,rubber:number}} scaled copy of a {top,aLat} profile */
export function scaleProfile(profile, difficulty) {
  const k = DIFFICULTY[difficulty] ?? DIFFICULTY.normal;
  return { top: profile.top * k.top, aLat: profile.aLat * k.aLat, rubber: k.rubber };
}

/** Profiles for `count` opponents (0..MAX_OPPONENTS, clamped to the available base profiles). */
export function buildOpponentProfiles(baseProfiles, count, difficulty) {
  const n = Math.max(0, Math.min(MAX_OPPONENTS, baseProfiles.length, Math.trunc(count) || 0));
  return baseProfiles.slice(0, n).map((profile) => scaleProfile(profile, difficulty));
}
