// localStorage access.  Every call is wrapped in try/catch (private mode, blocked storage, quota) and everything
// read back is validated by the pure parsers before use.
import { MODES, MODE_ORDER, parseBest } from './modes.js';
import { defaultSettings, parseSettings, serializeSettings } from './settings.js';
import { legacyUnlockedIds } from './skins.js';

export const SETTINGS_KEY = 'dino-run-locked-in:settings';
export const NICK_KEY = 'rug-racers-nick'; // shared with the sibling game so a player keeps one nickname

export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export const saveSettings = (settings) => safeSet(SETTINGS_KEY, serializeSettings(settings));

function hasUnlockedField(raw) {
  try {
    return Object.hasOwn(JSON.parse(raw), 'unlockedSkins');
  } catch {
    return false;
  }
}

/**
 * Validated settings.  Skins earned before Zen stopped counting are grandfathered once: the first load without an
 * `unlockedSkins` field records everything the old every-mode rule had unlocked.
 */
export function loadSettings() {
  const raw = safeGet(SETTINGS_KEY);
  const settings = parseSettings(raw, defaultSettings({ prefersReducedMotion: prefersReducedMotion() }));
  if (!hasUnlockedField(raw)) {
    const legacy = legacyUnlockedIds(loadBests()).filter((id) => id !== 'classic');
    if (legacy.length) {
      settings.unlockedSkins = [...new Set([...settings.unlockedSkins, ...legacy])];
      saveSettings(settings);
    }
  }
  return settings;
}

export const loadBest = (modeId) => parseBest(safeGet(MODES[modeId].bestKey));
export const saveBest = (modeId, score) => safeSet(MODES[modeId].bestKey, String(Math.max(0, Math.floor(score))));

/** { classic, hardcore, zen, timeattack } -> best score each. */
export const loadBests = () => Object.fromEntries(MODE_ORDER.map((id) => [id, loadBest(id)]));
