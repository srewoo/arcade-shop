// Environment ("weather") modes: ids, parsing, particle budgets and the snow traction tweak.  Pure, unit-tested.
//   auto  day/night + biome cycle driven by score (biomes.js)      day / night  locked time of day
//   snow  white world, falling snow, slightly floatier landings    rain  overcast, streaks, lightning + thunder
// Weather is cosmetic apart from the small snow gravity tweak; leaderboard boards are unaffected.

import { WEATHER_COUNTS, WEATHER_FACTORS } from '../tuning.js';

export const WEATHER_IDS = ['auto', 'day', 'night', 'snow', 'rain'];
export const DEFAULT_WEATHER = 'auto';
export const WEATHER_LABELS = { auto: 'Auto', day: 'Day', night: 'Night', snow: 'Snow', rain: 'Rain' };
/** Longer descriptions for assistive tech / tooltips (Snow changes gameplay a little). */
export const WEATHER_HINTS = { auto: 'Day and night cycle', day: 'Always day', night: 'Always night', snow: 'Snow: floatier landings, runs are unranked', rain: 'Rain and thunder' };

export const isWeather = (v) => typeof v === 'string' && WEATHER_IDS.includes(v);
export const parseWeather = (v) => (isWeather(v) ? v : DEFAULT_WEATHER);

/** Next / previous environment (wraps), used by the W key. */
export function cycleWeather(id, dir = 1) {
  const i = WEATHER_IDS.indexOf(parseWeather(id));
  return WEATHER_IDS[(i + (dir < 0 ? -1 : 1) + WEATHER_IDS.length) % WEATHER_IDS.length];
}

/** Snow: descending gravity is a little weaker, so landings are floatier.  Everything else is 1 (original). */
export const SNOW_FALL_GRAVITY = 0.92;
export const gravityScale = (weather, vy) => (weather === 'snow' && vy < 0 ? SNOW_FALL_GRAVITY : 1);

const BASE_COUNTS = WEATHER_COUNTS;
const REDUCED_COUNT = WEATHER_FACTORS.reducedCount; // reduced motion: fewer particles ...
const REDUCED_SPEED = WEATHER_FACTORS.reducedSpeed; // ... that move slower
const MOBILE_COUNT = WEATHER_FACTORS.mobileCount;

/**
 * @param quality 'auto' | 'high' | 'medium' | 'low'
 * @returns {{count:number, speed:number, lightning:boolean}} 0 count for weathers without particles
 */
export function particleBudget(weather, quality, { reduced = false, mobile = false } = {}) {
  const table = BASE_COUNTS[weather];
  if (!table) return { count: 0, speed: 1, lightning: false };
  let count = table[quality] ?? table.auto;
  if (mobile) count *= MOBILE_COUNT;
  if (reduced) count *= REDUCED_COUNT;
  return { count: Math.round(count), speed: reduced ? REDUCED_SPEED : 1, lightning: weather === 'rain' && !reduced };
}

/** Seconds until the next lightning strike for a roll in [0,1) (8..20 s). */
export const nextLightningDelay = (roll) => 8 + 12 * Math.min(Math.max(roll, 0), 1);

/** Lightning flash brightness 0..1 at `t` seconds after the strike: a quick double flicker. */
export function lightningIntensity(t) {
  if (t < 0 || t > 0.55) return 0;
  if (t < 0.08) return 1 - t / 0.08 * 0.4;
  if (t < 0.18) return 0.2;
  if (t < 0.26) return 0.9;
  return 0.9 * Math.max(0, 1 - (t - 0.26) / 0.29);
}

/** Thunder arrives later the further away the strike: 0.6..2.8 s for a roll in [0,1). */
export const thunderDelay = (roll) => 0.6 + 2.2 * Math.min(Math.max(roll, 0), 1);
