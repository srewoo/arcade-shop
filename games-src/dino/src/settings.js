// User settings: defaults, validation and (de)serialisation.  Pure: storage access lives in storage.js.
// Anything read back from localStorage goes through parseSettings(); unknown or malformed values fall back to defaults.
import { DEFAULT_MODE, isModeId } from './modes.js';
import { DEFAULT_SKIN, isSkinId } from './skins.js';
import { isQuality } from './qualityLevels.js';
import { DEFAULT_WEATHER, isWeather } from './world/weatherModes.js';
import { isHintId } from './coach.js';

/** Difficulty = speed multiplier applied to start speed, top speed and acceleration. */
export const DIFFICULTIES = {
  easy: { id: 'easy', label: 'Easy', mult: 0.85 },
  normal: { id: 'normal', label: 'Normal', mult: 1 },
  hard: { id: 'hard', label: 'Hard', mult: 1.15 },
};
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);
export const isDifficulty = (v) => typeof v === 'string' && Object.hasOwn(DIFFICULTIES, v);
export const difficultyMult = (id) => (isDifficulty(id) ? DIFFICULTIES[id].mult : 1);

export const MOTION_MODES = ['system', 'on', 'off'];
export const THEMES = ['system', 'light', 'dark'];
export const TEXT_SCALES = [1, 1.25, 1.5];
export const isMotion = (v) => typeof v === 'string' && MOTION_MODES.includes(v);
export const isTheme = (v) => typeof v === 'string' && THEMES.includes(v);

/** Effective reduced-motion flag from the System / On / Off choice and the OS preference. */
export const effectiveReducedMotion = (motion, osPrefersReduced) => motion === 'on' || (motion !== 'off' && Boolean(osPrefersReduced));

export function defaultSettings({ prefersReducedMotion = false } = {}) {
  return {
    mode: DEFAULT_MODE,
    difficulty: 'normal',
    volume: 1, // 0..1 (1 = the original master gain)
    quality: 'auto',
    shake: true,
    motion: 'system', // Reduce motion: system | on | off
    reducedMotion: prefersReducedMotion, // effective flag derived from `motion` (not an input on load)
    colorAssist: false, // colour-blind assist: symbols next to colour cues
    textScale: 1, // HUD / UI text size 1 | 1.25 | 1.5
    theme: 'system', // UI chrome: system | light | dark
    muted: false, // M key / Mute checkbox
    seenHints: [], // first-run coaching already shown
    unlockedSkins: [], // skins ever unlocked (grandfathers unlocks earned before Zen stopped counting)
    powerups: true, // power-ups in Hardcore / Zen / Time Attack
    classicPlus: false, // power-ups + new obstacles in Classic
    skin: DEFAULT_SKIN,
    weather: DEFAULT_WEATHER, // environment: auto | day | night | snow | rain
  };
}

const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

function parseTextScale(v, fallback) {
  const hit = typeof v === 'number' ? TEXT_SCALES.find((n) => Math.abs(n - v) < 1e-6) : undefined;
  return hit ?? fallback;
}

const parseIdList = (v, isId) => (Array.isArray(v) ? [...new Set(v.filter(isId))] : []);

/** `motion` wins; a legacy boolean `reducedMotion` maps to on, or (when the OS asks for less motion) to off. */
function parseMotion(data, defaults) {
  if (isMotion(data.motion)) return data.motion;
  if (data.reducedMotion === true) return 'on';
  if (data.reducedMotion === false && defaults.reducedMotion) return 'off';
  return defaults.motion ?? 'system';
}

function parseVolume(v, fallback) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
}

/** @param raw a JSON string, an object, or anything else (-> defaults) */
export function parseSettings(raw, defaults = defaultSettings()) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...defaults };
  const motion = parseMotion(data, defaults);
  return {
    mode: isModeId(data.mode) ? data.mode : defaults.mode,
    difficulty: isDifficulty(data.difficulty) ? data.difficulty : defaults.difficulty,
    volume: parseVolume(data.volume, defaults.volume),
    quality: isQuality(data.quality) ? data.quality : defaults.quality,
    shake: bool(data.shake, defaults.shake),
    motion,
    reducedMotion: motion === 'on' ? true : motion === 'off' ? false : defaults.reducedMotion,
    colorAssist: bool(data.colorAssist, defaults.colorAssist),
    textScale: parseTextScale(data.textScale, defaults.textScale),
    theme: isTheme(data.theme) ? data.theme : defaults.theme,
    muted: bool(data.muted, defaults.muted),
    seenHints: parseIdList(data.seenHints, isHintId),
    unlockedSkins: parseIdList(data.unlockedSkins, isSkinId),
    powerups: bool(data.powerups, defaults.powerups),
    classicPlus: bool(data.classicPlus, defaults.classicPlus),
    skin: isSkinId(data.skin) ? data.skin : defaults.skin,
    weather: isWeather(data.weather) ? data.weather : defaults.weather,
  };
}

export const serializeSettings = (s) => JSON.stringify(parseSettings(s));

/** Camera-shake strength multiplier (0 when off or reduced motion is on). */
export const shakeScale = (s) => (s.shake && !s.reducedMotion ? 1 : 0);
