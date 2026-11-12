// Per-frame alerts raised while a run is live: power-up and Time Attack warnings, first-run coaching, the 3-2-1 after
// a resume.  They only emit events (feedback.js reacts) and never change the simulation.
import { game, powers, settings } from './state.js';
import { obstacles } from './systems.js';
import { updateCamera } from './camera.js';
import { events } from './events.js';
import { POWERUP_IDS } from './powerups.js';
import { COACH } from './tuning.js';
import { countdownNumber } from './pauseMath.js';
import { pendingHint } from './coach.js';
import { hintFlags, CLOCK_WARN_SECONDS } from './runFlags.js';

/** One warning per whole second while a power-up is in its last seconds (sound + HUD pulse). */
export function warnExpiring() {
  for (const id of POWERUP_IDS) {
    if (!powers.expiring(id)) continue;
    const sec = Math.ceil(powers.remaining(id));
    if (sec === hintFlags.warnSec[id]) continue;
    hintFlags.warnSec[id] = sec;
    events.emit('powerWarn', id);
  }
}

/** Time Attack: a tick at 10, 5, 3, 2 and 1 seconds left. */
export function warnClock() {
  const sec = Math.ceil(game.timeLeft);
  if (sec === hintFlags.clockSec) return;
  hintFlags.clockSec = sec;
  if (CLOCK_WARN_SECONDS.includes(sec)) events.emit('timeWarn', sec);
}

/** First-run coaching: the duck hint near the first mid pterodactyl / log, and the controls line auto-hide. */
export function coach() {
  if (game.autoplay) return;
  if (!hintFlags.hintsHidden && game.runTime > COACH.hintsAutoHideS) {
    hintFlags.hintsHidden = true;
    events.emit('hintsTimeout');
  }
  if (settings.seenHints.includes('duck')) return;
  const nearest = obstacles.next(game.z);
  const id = nearest ? pendingHint({ seen: settings.seenHints, nearest, distanceAhead: game.z - nearest.z }) : null;
  if (id) events.emit('coach', { id });
}

/** 3-2-1 after a resume: nothing moves (so no countdown or power-up runs) until it reaches 0. */
export function resumeCountdown(dt) {
  game.resumeGrace = Math.max(0, game.resumeGrace - dt);
  events.emit('countdown', countdownNumber(game.resumeGrace));
  updateCamera(0);
}

