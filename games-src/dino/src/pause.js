// Pause / resume / restart / quit.  Triggers: P or Esc while running, the pause button, and automatic pausing when the
// window loses focus or the tab is hidden.  Resume is always manual and ends with a short 3-2-1.
// Nothing here can end a run by accident: Restart, Quit and End run are confirmed on the overlay first (ui-pause.js).
import { game } from './state.js';
import { audio, input } from './systems.js';
import { events } from './events.js';
import { go } from './flow.js';
import { canAutoPause } from './pauseMath.js';
import { canPause } from './stateMachine.js';
import { FLOW } from './tuning.js';
import { startRun, backToTitle } from './run.js';
import { finishRun, recoverFromStumble } from './crash.js';

/** Pause the live run.  `reason`: 'manual' | 'blur' | 'hidden'.  Returns whether it paused. */
export function pauseGame(reason = 'manual') {
  if (!canPause(game.state)) return false;
  game.pausedFrom = game.state;
  if (!go('paused')) return false;
  game.pauseReason = reason;
  input.release(); // held keys / fingers must not carry over into the pause
  audio.setPaused(true, { suspend: reason !== 'manual' });
  events.emit('pause', { reason });
  return true;
}

/** Auto-pause (blur / hidden) only while a run is live and the player is not in a dialog. */
export function autoPause(reason) {
  if (!canAutoPause(game)) return false;
  return pauseGame(reason);
}

function leavePause(to) {
  game.pauseReason = null;
  audio.setPaused(false);
  game.pausedFrom = null;
  return go(to);
}

/** Resume play with a short 3-2-1 grace. */
export function resumeGame() {
  if (game.state !== 'paused' || game.menuOpen) return false;
  const back = game.pausedFrom ?? 'running';
  if (!leavePause(back)) return false;
  game.resumeGrace = FLOW.resumeGraceS;
  events.emit('resume');
  return true;
}

export const togglePause = () => (game.state === 'paused' ? resumeGame() : pauseGame('manual'));

/** Restart from the pause overlay (a fresh run, no grace). */
export function restartFromPause() {
  if (game.state !== 'paused') return;
  game.pauseReason = null;
  audio.setPaused(false);
  events.emit('resume');
  startRun();
}

/** Quit to the title from the pause overlay. */
export function quitFromPause() {
  if (game.state !== 'paused') return;
  game.pauseReason = null;
  audio.setPaused(false);
  events.emit('resume');
  backToTitle();
}

/** End the run from the pause overlay (Zen's "END RUN"): back to the live state, then show the result. */
export function endRunFromPause() {
  if (game.state !== 'paused') return;
  const from = game.pausedFrom ?? 'running';
  leavePause(from);
  events.emit('resume');
  if (from === 'stumble') recoverFromStumble();
  finishRun('RUN OVER');
}
