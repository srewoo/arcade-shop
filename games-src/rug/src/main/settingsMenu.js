// Settings state + panel controller (key O, the title button or the pause menu; Esc closes). Values are
// validated and persisted to localStorage (rug-racers-settings) on every change; effects that are live
// (volume channels, quality, Reduce motion, colour-blind assist, HUD size) apply immediately, the rest
// are read when the next race starts.
import { DEFAULT_SETTINGS, loadSettings, saveSettings, validateSetting, QUALITY_SCALE } from "../logic/settings.js";
import { sfx } from "../audio/sfx.js";
import { titleBestText } from "./records.js";
import { applyAppearance } from "./appearance.js";
import { ui } from "./bootstrap.js";
import { layout, requestResize } from "./layout.js";
import { applyPrefs } from "./prefs.js";
import { app } from "./state.js";

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Live settings object (mutated in place, so importers always see current values). */
export const settings = { ...DEFAULT_SETTINGS, ...loadSettings(safeStorage()) };

let open = false;
let opener = null;
let overTitle = false;
export const isSettingsOpen = () => open;

const PREF_KEYS = ["volume", "sfxVolume", "engineVolume", "reduceMotion", "colourBlind", "hudScale"];

/** Apply the settings that have an immediate side effect (audio, resolution/quality, accessibility). */
export function applyLiveSettings() {
  applyPrefs(settings);
  layout.fixedQuality = settings.quality !== "auto";
  layout.resolutionScale = QUALITY_SCALE[settings.quality];
  requestResize();
}

/** Validate + store one setting; returns the stored value. */
export function updateSetting(key, value) {
  settings[key] = validateSetting(key, value);
  saveSettings(safeStorage(), settings);
  if (key === "quality") applyLiveSettings();
  else if (PREF_KEYS.includes(key)) applyPrefs(settings);
  if (key === "theme" || key === "pattern" || key === "floor") applyAppearance(settings);
  ui.setTitleLabels(settings.laps);
  ui.setTitleBest(titleBestText(settings.laps));
  return settings[key];
}

function redraw() {
  ui.drawSettings(settings, (key, value, live) => {
    updateSetting(key, value);
    if (live) return; // slider drag: keep the control, do not redraw
    sfx.click();
    redraw();
  });
}

export function openSettings() {
  if (open) return;
  open = true;
  opener = document.activeElement;
  sfx.click();
  redraw();
  overTitle = app.mode === "title";
  if (overTitle) ui.showTitle(false); // the title would ghost through the panel
  ui.showSettings(true); // after drawing so the first control can take focus
}

/** Close the panel, bring the title back when it was open over it, and return focus to the opener. */
export function closeSettings() {
  if (!open) return;
  open = false;
  sfx.back();
  ui.showSettings(false);
  if (overTitle) ui.showTitle(true);
  overTitle = false;
  if (opener?.isConnected && typeof opener.focus === "function") opener.focus();
  opener = null;
}
