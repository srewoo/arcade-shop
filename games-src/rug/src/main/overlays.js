// Pause overlay and first-run tips: the controllers that decide when the simulation is frozen.
// Menu code stays out of the simulation: pausing only withholds the per-frame update calls.
import {
  createPauseState, openPause, askConfirm, cancelConfirm, back, resume, shouldAutoPause, isSimFrozen,
} from "../logic/pauseState.js";
import { tipsSeen, markTipsSeen } from "../logic/onboarding.js";
import { sfx } from "../audio/sfx.js";
import { createAudioEvents } from "../audio/audioEvents.js";
import { STR } from "../ui/strings.js";
import { ui } from "./bootstrap.js";
import { app } from "./state.js";
import { isSettingsOpen } from "./settingsMenu.js";

export const emitAudio = createAudioEvents(sfx);

let pause = createPauseState();
let tipsOpen = false;
let hooks = { clearInputs() {}, restart() {}, quit() {}, openSettings() {}, isTouch: false, laps: () => 3 };

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const isPaused = () => pause.open;
export const isTipsOpen = () => tipsOpen;
/** True while the simulation and timers must not advance (pause, settings, tips). */
export const isFrozen = () => isSimFrozen(pause, isSettingsOpen(), tipsOpen);

function show() {
  ui.showPause(pause.open, pause.view, pause.confirm);
}

/** Open the pause overlay (only during an intro or race). Returns true when it opened. */
export function pauseGame(reason = "key") {
  const next = openPause(pause, app.mode, reason);
  if (next === pause) return false;
  pause = next;
  hooks.clearInputs();
  sfx.pause();
  show();
  ui.announce(reason === "auto" ? STR.pause.auto : STR.status.paused);
  return true;
}

export function resumeGame() {
  if (!pause.open) return;
  pause = resume();
  hooks.clearInputs();
  ui.coverPause(false);
  show();
  sfx.resume();
  ui.announce(STR.status.resumed);
}

/** Drop the overlay without resume feedback (a confirmed restart / quit replaces the run). */
function closeSilently() {
  pause = resume();
  ui.coverPause(false);
  show();
  hooks.clearInputs();
}

function onAct(act) {
  if (act === "resume") resumeGame();
  else if (act === "restart" || act === "quit") {
    pause = askConfirm(pause, act);
    sfx.click();
    show();
  } else if (act === "cancel") {
    pause = cancelConfirm(pause);
    sfx.back();
    show();
  } else if (act === "settings") hooks.openSettings();
  else if (act === "confirm") {
    const action = pause.confirm;
    closeSilently();
    sfx.confirm();
    if (action === "restart") hooks.restart();
    else if (action === "quit") hooks.quit();
  }
}

/** Esc / P while the overlay is open: back out of a confirmation, otherwise resume. */
export function handlePauseKeys(pressed) {
  if (!(pressed("Escape") || pressed("KeyP"))) return;
  const wasConfirm = pause.view === "confirm";
  pause = back(pause);
  if (wasConfirm) {
    sfx.back();
    show();
  } else {
    hooks.clearInputs();
    ui.coverPause(false);
    show();
    sfx.resume();
    ui.announce(STR.status.resumed);
  }
}

export function openTips(firstRun = false) {
  if (tipsOpen) return;
  tipsOpen = true;
  ui.showTips(true, { laps: hooks.laps(), touch: hooks.isTouch, firstRun });
}

export function closeTips() {
  if (!tipsOpen) return;
  tipsOpen = false;
  markTipsSeen(storage());
  hooks.clearInputs();
  ui.showTips(false);
  sfx.confirm();
}

/** First race ever. Keyboard: the how-to card holds the clock until dismissed. Touch: one tap starts the race and a
 * non-blocking tip chip fades by itself (the "How to play" button still opens the full card). */
export function showTipsIfFirstRun() {
  if (tipsSeen(storage())) return;
  if (!hooks.isTouch) return openTips(true);
  markTipsSeen(storage());
  ui.showTouchTip(true);
}

/** Per-frame housekeeping: keeps the pause card hidden while the settings panel is on top of it. */
let wasCovered = false;
export function syncOverlays() {
  const covered = pause.open && isSettingsOpen();
  ui.coverPause(covered);
  // back from Settings into the pause menu: focus returns to the Settings button that opened it
  if (wasCovered && !covered && pause.open) ui.pauseEl.querySelector('[data-act="settings"]')?.focus();
  wasCovered = covered;
}

function autoPause() {
  if (shouldAutoPause(app.mode, pause, true)) pauseGame("auto");
}

export function initOverlays(h) {
  hooks = { ...hooks, ...h };
  ui.initDialogs(onAct, closeTips);
  document.addEventListener("visibilitychange", () => document.hidden && autoPause());
  window.addEventListener("blur", autoPause);
}
