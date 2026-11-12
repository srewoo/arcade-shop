// Subscribes the HUD, audio and particles to gameplay events (events.js), so run.js and crash.js stay free of DOM and
// sound calls.  Everything here respects Reduce motion, mute and volume.
import * as THREE from 'three';
import { game, settings, params } from './state.js';
import { audio, hud, puffs, obstacles } from './systems.js';
import { events } from './events.js';
import { saveSettings } from './storage.js';
import { POWERUPS } from './powerups.js';
import { records } from './records.js';
import { isRunRanked, snapshotRun } from './ranking.js';
import { hintText, pickupToast } from './coach.js';
import { COACH, JUICE } from './tuning.js';
import { S } from './strings.js';
import { pickupBurstCount, confettiCount } from './juice.js';
import { punchFov } from './camera.js';
import { Confetti } from './fx/confetti.js';
import { showPause, hidePause } from './ui-pause.js';
import { MODES } from './modes.js';

const _p = new THREE.Vector3();
const touch = params.coarsePointer;
let confetti = null;

/** Remember a hint / first-pickup tip so it is only shown once. */
function markSeen(id) {
  if (settings.seenHints.includes(id)) return;
  settings.seenHints.push(id);
  saveSettings(settings);
}

function onPickup({ kind, z }) {
  audio.pickup();
  if (kind === 'slowmo') audio.slowmo(true);
  hud.toast(pickupToast(kind, POWERUPS[kind].label, settings.seenHints, touch));
  markSeen(kind);
  const burst = pickupBurstCount({ reduced: settings.reducedMotion, quality: settings.quality, mobile: touch });
  if (burst > 0) puffs.ring(_p.set(0, 1.4, z), burst);
}

function onGameOver({ title, score, newBest, killer }) {
  const mode = game.mode;
  const rank = game.runRank ?? snapshotRun(settings, mode); // frozen at run start (and tainted by mid-run changes)
  const ranked = isRunRanked(rank);
  hud.showGameOver({
    title, score, newBest, killer, mode, ranked,
    reasons: rank.reasons,
    unlocked: records.unlocked,
    summary: { dist: game.dist, pickups: game.stats.pickups, cleared: obstacles.cleared, best: records.best(mode), timeLimit: MODES[mode].timeLimit },
  });
  if (!game.autoplay) hud.offerSave(score, mode, ranked);
  if (newBest) celebrate();
  else if (title === 'TIME UP') audio.timeUp();
  else audio.gameOver();
  hud.announce(`${title}. Score ${score}.${newBest ? ' New best.' : ''}`);
}

/** New best: arpeggio, confetti and a brief field-of-view punch (confetti and punch skipped under reduced motion). */
function celebrate() {
  audio.newBest();
  const count = confettiCount({ reduced: settings.reducedMotion, quality: settings.quality, mobile: touch });
  if (count > 0) {
    confetti?.start(count);
    punchFov(JUICE.newBestFovKick);
  }
}

function onState({ to }) {
  if (to === 'crashed' || to === 'gameover' || to === 'title') hud.setRunning(false);
  if (to === 'title') hud.hideCoach();
}

function onRunStart({ auto }) {
  hud.hideCoach();
  if (auto || settings.seenHints.includes('jump')) return;
  hud.showCoach(hintText('jump', touch), COACH.showMs);
  markSeen('jump');
}

function onCoach({ id }) {
  hud.showCoach(hintText(id, touch), COACH.showMs);
  markSeen(id);
}

/** Wire every gameplay event to its feedback.  Call once at boot. */
export function wireFeedback() {
  confetti = new Confetti(document.getElementById('confetti'));
  events.on('score', (n) => hud.setScore(n));
  events.on('best', ({ mode, best }) => mode === game.mode && hud.setBest(best));
  events.on('milestone', (n) => {
    hud.pop();
    audio.milestone();
    hud.announce(`Score ${n}`);
  });
  events.on('pickup', onPickup);
  events.on('shieldBreak', () => {
    audio.shieldBreak();
    hud.toast('SHIELD BROKE');
    if (!settings.reducedMotion) hud.flash();
  });
  events.on('hit', () => audio.crash());
  events.on('recover', () => audio.recover());
  events.on('gameover', onGameOver);
  events.on('state', onState);
  events.on('runStart', onRunStart);
  events.on('coach', onCoach);
  events.on('hintsTimeout', () => hud.hideHints());
  events.on('powerWarn', () => audio.warn());
  events.on('powerEnd', (id) => (id === 'slowmo' ? audio.slowmo(false) : audio.powerEnd()));
  events.on('timeWarn', (sec) => audio.tick((10 - sec) / 10));
  events.on('countdown', (n) => hud.setCountdown(n));
  events.on('pause', ({ reason }) => {
    game.uiHidden = false;
    hud.setUiHidden(false);
    showPause();
    hud.announce(reason === 'manual' ? S.pause.title : S.pause[reason === 'hidden' ? 'reasonHidden' : 'reasonBlur']);
  });
  events.on('resume', () => hidePause());
  events.on('biome', () => audio.biome());
}
