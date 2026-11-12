// Wires input -> game actions (jump / start / restart / hotkeys / buttons / auto-pause / resize).
//   P or Esc pause while running (Esc on the overlay resumes), W cycles the environment (title), A autoplay, H hide UI,
//   M mute, S settings (title / game over / pause), <- -> or 1-4 pick a mode (title).
//   Esc layers: close settings, else resume / back out of a confirmation, else game over -> title, else pause.
import { TUNING } from './config.js';
import { FLOW } from './tuning.js';
import { game, settings } from './state.js';
import { audio, input, autopilot, hud } from './systems.js';
import { startRun, backToTitle, skipCrash } from './run.js';
import { resize } from './camera.js';
import { modeFromKey } from './modes.js';
import { saveSettings } from './storage.js';
import { openSettings, closeSettings } from './ui-settings.js';
import { renderModes, selectMode, stepMode, stepWeather } from './ui-modes.js';
import { pauseGame, autoPause, togglePause } from './pause.js';
import { escAction } from './pauseMath.js';
import { pauseBack, showEndConfirm } from './ui-pause.js';
import { restartGovernor } from './quality.js';
import { pressStart } from './ui-start.js';

/** Esc: layered "back" action. */
function goBack() {
  const action = escAction(game);
  if (action === 'closeSettings') closeSettings();
  else if (action === 'pauseBack') pauseBack();
  else if (action === 'toTitle') {
    backToTitle();
    renderModes();
  } else if (action === 'pause') pauseGame('manual');
}

function toggleMute() {
  audio.setMuted(!audio.muted);
  settings.muted = audio.muted;
  saveSettings(settings);
  hud.setMuted(audio.muted);
}

function toggleAuto() {
  game.autoplay = !game.autoplay;
  hud.setAuto(game.autoplay);
  if (!game.autoplay) return;
  autopilot.reset();
  autopilot.failAt += game.runTime; // RE: blunder timer counts from now, not from run start
}

function handleKey(code) {
  if (code === 'Escape') goBack();
  else if (code === 'KeyP') !game.menuOpen && togglePause();
  else if (code === 'KeyS') openSettings();
  else if (code === 'KeyW') stepWeather();
  else if (code === 'KeyA') toggleAuto();
  else if (code === 'KeyH') {
    if (game.state === 'paused') return;
    game.uiHidden = !game.uiHidden;
    hud.setUiHidden(game.uiHidden);
  } else if (code === 'KeyM') toggleMute();
  else if (code === 'ArrowLeft') stepMode(-1);
  else if (code === 'ArrowRight') stepMode(1);
  else if (modeFromKey(code)) selectMode(modeFromKey(code));
}

/** Jump / tap / Space / Enter, by state. */
function onJump() {
  if (hud.typing || game.menuOpen) return;
  audio.unlock(); // browsers require a user gesture to start audio
  if (game.state === 'title') pressStart() && startRun();
  else if (game.state === 'running') {
    if (game.resumeGrace <= 0) game.jumpBuffer = TUNING.jumpBuffer;
  }
  else if (game.state === 'crashed') skipCrash();
  else if (game.state === 'gameover' && game.overT >= FLOW.overInputGuardS) startRun();
}

function wireButtons() {
  const click = (id, fn) => document.getElementById(id).addEventListener('click', (e) => {
    audio.unlock();
    if (e.detail) e.currentTarget.blur(); // pointer click: keep Space free for jumping
    fn(e);
  });
  click('btn-start', () => pressStart() && startRun());
  // keyboard / assistive "click" right after the card appears is ignored, like a jump press would be
  click('btn-restart', (e) => game.state === 'gameover' && (e.detail > 0 || game.overT >= FLOW.overInputGuardS) && startRun());
  click('btn-menu', () => {
    if (game.state !== 'gameover') return;
    backToTitle();
    renderModes();
  });
  click('btn-pause', () => pauseGame('manual'));
  click('btn-help', () => hud.peekHints());
  click('btn-end', () => pauseGame('manual') && showEndConfirm());
}

/** Auto-pause when the window loses focus or the tab is hidden; resume stays manual. */
function wireAutoPause() {
  window.addEventListener('blur', () => autoPause('blur'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause('hidden');
    else restartGovernor();
  });
  window.addEventListener('pagehide', () => autoPause('hidden'));
}

/** Click sounds for every button (data-snd picks tick / confirm / back). */
function wireUiSounds() {
  document.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button') : null;
    if (!b || b.disabled) return;
    audio.unlock();
    audio.ui(b.dataset.snd ?? 'tick');
  });
}

export function wireControls() {
  input.claims = (code) => {
    if (game.menuOpen) return false;
    return code === 'KeyS' ? ['title', 'gameover', 'paused'].includes(game.state) : game.state === 'title';
  };
  input.onJump = onJump;
  input.onKey = (code) => {
    if (hud.typing) return;
    audio.unlock();
    handleKey(code);
  };
  wireButtons();
  wireAutoPause();
  wireUiSounds();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
}
