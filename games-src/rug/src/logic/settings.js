// Player settings: allowed values, validation, load/save. Pure (no three, no DOM); storage is injected.

import { THEME_IDS, PATTERN_IDS, FLOOR_IDS } from "./appearance.js";

export const SETTINGS_KEY = "rug-racers-settings";

/** Allowed values for the enumerated settings (first listed = shown first in the panel). */
export const SETTING_OPTIONS = Object.freeze({
  difficulty: ["easy", "normal", "hard", "insane"],
  opponents: [0, 1, 2, 3, 4, 5],
  laps: [1, 3, 5],
  padDensity: ["normal", "more"],
  camera: ["chase", "far", "topdown", "cockpit"],
  quality: ["auto", "high", "medium", "low"],
  theme: THEME_IDS,
  pattern: PATTERN_IDS,
  floor: FLOOR_IDS,
  reduceMotion: ["system", "on", "off"],
  colourBlind: [false, true],
  hudScale: [100, 125, 150],
  boostMode: ["hold", "toggle"],
});

/** Slider settings: a number 0..1 (shown as 0-100 %). */
export const RANGE_KEYS = Object.freeze(["volume", "sfxVolume", "engineVolume"]);

/** Defaults reproduce the original game: 3 AI on Normal, 3 laps, 5 pads per lap, chase cam. */
export const DEFAULT_SETTINGS = Object.freeze({
  difficulty: "normal",
  opponents: 3,
  laps: 3,
  padDensity: "normal",
  camera: "chase",
  volume: 1,
  quality: "auto",
  theme: "classic",
  pattern: "playmat",
  floor: "parquet",
  reduceMotion: "system",
  colourBlind: false,
  hudScale: 100,
  boostMode: "hold",
  sfxVolume: 1,
  engineVolume: 1,
});

/** Boost pads per lap for each density option. */
export const PAD_COUNTS = Object.freeze({ normal: 5, more: 8 });

/** Resolution scale per quality option ("auto" starts at 1 and adapts to the frame rate). */
export const QUALITY_SCALE = Object.freeze({ auto: 1, high: 1, medium: 0.8, low: 0.62 });

/** Laps of the default race; the online leaderboard only accepts this configuration. */
export const LEADERBOARD_LAPS = 3;

/** Validate one setting; returns the value if allowed, otherwise the default. */
export function validateSetting(key, value) {
  const fallback = DEFAULT_SETTINGS[key];
  if (RANGE_KEYS.includes(key)) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
      ? Math.round(value * 100) / 100
      : fallback;
  }
  const options = SETTING_OPTIONS[key];
  return options && options.includes(value) ? value : fallback;
}

/** Build a complete, valid settings object from untrusted input (unknown keys are dropped). */
export function validateSettings(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) out[key] = validateSetting(key, source[key]);
  return out;
}

/** Read settings from a Storage-like object; any failure or corruption yields the defaults. */
export function loadSettings(storage) {
  try {
    const text = storage?.getItem(SETTINGS_KEY);
    return validateSettings(text ? JSON.parse(text) : null);
  } catch {
    return validateSettings(null);
  }
}

/** Persist settings; returns false (never throws) when storage is unavailable or full. */
export function saveSettings(storage, settings) {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(validateSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

/**
 * True when a finished race may be posted to the online board `rug:<mapId>`: the default race only
 * (race mode, 3 laps, at least one AI car, normal pad density) so boards stay comparable.
 */
export function leaderboardEligible({ kind, laps, opponents, padDensity }) {
  return kind === "race" && laps === LEADERBOARD_LAPS && opponents >= 1 && padDensity === "normal";
}

/** Effective Reduce motion: "on" / "off" win, "system" follows the OS preference. */
export function resolveReduceMotion(setting, systemPrefersReduced) {
  if (setting === "on") return true;
  if (setting === "off") return false;
  return !!systemPrefersReduced;
}

/** HUD scale factor (1, 1.25 or 1.5) from the stored percentage. */
export const hudScaleFactor = (percent) => (SETTING_OPTIONS.hudScale.includes(percent) ? percent / 100 : 1);

/** Particle-count multiplier: Reduce motion cuts effects to at most 40 %. */
export const particleScale = (reduced) => (reduced ? 0.4 : 1);
