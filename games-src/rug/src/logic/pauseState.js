// Pause overlay state machine. Pure (no DOM). The game freezes while `open` is true.
//   views: "menu" (Resume / Restart / Settings / Quit) and "confirm" (restart or quit needs a second press).

/** Modes in which the player can pause (a run in progress). */
export const PAUSABLE_MODES = Object.freeze(["intro", "race"]);

export const canPause = (mode) => PAUSABLE_MODES.includes(mode);

export const createPauseState = () => ({ open: false, view: "menu", confirm: null, reason: null });

/** Open the overlay. Returns the same state when already open or the mode cannot pause. */
export function openPause(state, mode, reason = "key") {
  if (state.open || !canPause(mode)) return state;
  return { open: true, view: "menu", confirm: null, reason };
}

/** Ask for confirmation of a destructive action ("restart" | "quit"). Ignored while closed. */
export function askConfirm(state, action) {
  if (!state.open || (action !== "restart" && action !== "quit")) return state;
  return { ...state, view: "confirm", confirm: action };
}

/** Back out of the confirmation, to the menu. */
export function cancelConfirm(state) {
  return state.open ? { ...state, view: "menu", confirm: null } : state;
}

/** Esc: step back from a confirmation, otherwise resume. */
export function back(state) {
  if (!state.open) return state;
  return state.view === "confirm" ? cancelConfirm(state) : createPauseState();
}

/** Resume play (always closes). */
export const resume = () => createPauseState();

/** Auto-pause triggers: tab hidden or window blur during active play only. */
export function shouldAutoPause(mode, state, hidden) {
  return hidden && canPause(mode) && !state.open;
}

/** Whether the simulation and timers may advance this frame. */
export const isSimFrozen = (state, settingsOpen, tipsOpen = false) => state.open || settingsOpen || tipsOpen;
