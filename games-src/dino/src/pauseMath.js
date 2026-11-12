// Pause rules as pure functions (the DOM / audio side is pause.js).
import { FLOW } from './tuning.js';
import { canPause } from './stateMachine.js';

/** May an automatic pause (window blur / hidden tab) fire now?  Only mid-run (also during the resume 3-2-1) and outside dialogs. */
export const canAutoPause = ({ state, menuOpen = false }) => canPause(state) && !menuOpen;

/** The 3-2-1 number to show for `left` seconds of grace remaining (0 = done). */
export const countdownNumber = (left, total = FLOW.resumeGraceS) => (left > 0 ? Math.min(3, Math.ceil((left / total) * 3)) : 0);

/**
 * What the Esc key does, in layers: close settings, then back out of the pause overlay, then (game over) go to the
 * title, then (a live run) pause.  Esc never ends a run by itself.
 */
export function escAction({ state, menuOpen }) {
  if (menuOpen) return 'closeSettings';
  if (state === 'paused') return 'pauseBack';
  if (state === 'gameover') return 'toTitle';
  if (canPause(state)) return 'pause';
  return 'none';
}
