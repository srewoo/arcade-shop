// Entry point: render loop, boot and (after first paint) physics loading (bundle functions eg frame, tg warmUpRagdoll, ng boot).
import { game, debug, settings, powers, params } from './state.js';
import { renderer, scene, camera, dino, obstacles, autopilot, sim, hud, world, audio } from './systems.js';
import { initPhysics } from './physics/ragdoll.js';
import { resetRun, startRun, tick, wireCallbacks } from './run.js';
import { wireControls } from './controls.js';
import { resize, updateCamera } from './camera.js';
import { sampleFrame } from './quality.js';
import { initSettings } from './ui-settings.js';
import { renderModes, renderWeather } from './ui-modes.js';
import { applySettings } from './apply-settings.js';
import { wireFeedback } from './feedback.js';
import { initPauseUi } from './ui-pause.js';
import { initChrome, setStartReady, setStartProgress } from './ui-chrome.js';
import { LOAD_STEPS, shouldFireQueued } from './startFlow.js';
import { initFpsOverlay, sampleFps } from './fpsOverlay.js';
import { events } from './events.js';
import { go } from './flow.js';
import { records } from './records.js';
import { telemetry, summarize } from './telemetry.js';
import { pauseGame, resumeGame } from './pause.js';
import { prefersReducedMotion } from './storage.js';

wireCallbacks();
wireFeedback();
wireControls();

const MAX_DT = 1 / 30; // simulation step is clamped to 30 fps worth of time
let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  if (game.state !== 'paused') sampleFrame(dt);
  if (params.fps) sampleFps(dt, now);
  if (!debug.paused) tick(Math.min(Math.max(dt, 0), MAX_DT));
  renderer.render(scene, camera);
}

/**
 * Run a throw-away 45-step ragdoll (dino thrown at a post and a ball) so Rapier's first-use costs, and
 * shader/pipeline compilation for ragdoll meshes, are paid before the first crash.
 */
function warmUpRagdoll() {
  const savedImpact = sim.onImpact;
  sim.onImpact = null;
  dino.detach();
  sim.start(dino.list, [
    { dynamic: false, pos: { x: 0, y: 0, z: -2.5 }, shapes: [{ box: [0.25, 0.8, 0.25], at: [0, 0.8, 0] }] },
    { dynamic: true, pos: { x: 0.2, y: 2.4, z: -3 }, shapes: [{ ball: 0.5 }] },
  ]);
  sim.nudge({ x: 0, y: 0, z: -16 }, { x: -3, y: 1, z: 1 });
  for (let i = 0; i < 45; i++) sim.step(1 / 60);
  sim.dispose();
  sim.onImpact = savedImpact;
}

const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));

/** Rapier loads after the title is on screen; START unlocks once it is ready (a title dwell normally covers it). */
async function loadPhysics() {
  try {
    setStartProgress(LOAD_STEPS.engine);
    await initPhysics();
    setStartProgress(LOAD_STEPS.idle);
    await new Promise((resolve) => idle(resolve));
    setStartProgress(LOAD_STEPS.warm);
    resetRun();
    warmUpRagdoll();
    resetRun(); // re-attaches the dino (reset() -> attach()) after the warm-up detached it
    game.physicsReady = true;
    setStartReady(true);
    // a Space / tap made while loading starts the run now (never after the player left the title or opened a dialog)
    const fire = shouldFireQueued({ queued: game.startQueued, state: game.state, menuOpen: game.menuOpen });
    game.startQueued = false;
    if (fire) startRun();
  } catch (err) {
    console.error('Physics failed to load', err);
    hud.toast('Could not load physics. Reload to play.', 8000);
  }
}

function boot() {
  resize();
  applySettings(); // volume, quality, shake, reduced motion, theme, skin, mode rules
  initChrome();
  initPauseUi();
  initSettings();
  renderModes();
  renderWeather();
  world.weather.rain.onThunder = () => audio.thunder();
  world.dayNight.onBiome = (name) => {
    hud.toast(name.toUpperCase(), 2600);
    events.emit('biome', name);
  };
  hud.setAuto(game.autoplay);
  hud.setUiHidden(game.uiHidden);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', applySettings);
  setStartProgress(LOAD_STEPS.boot);
  resetRun();
  renderer.compile(scene, camera); // first-run shaders are built now, not at the first jump
  go('title');
  hud.showTitle(true);
  updateCamera(0, true);
  if (params.fps) initFpsOverlay();
  document.getElementById('loading').classList.add('done');
  requestAnimationFrame((now) => {
    lastTime = now;
    frame(now);
  });
  loadPhysics();
}

// Debug / test hooks: only with ?debug=1 (or on the dev server), not in a normal build.
if (params.debug) {
  window.__dino = {
    game, debug, dino, obstacles, autopilot, sim, camera, renderer, scene, startRun, world, settings, powers, hud,
    tick, resetRun, records, events, audio, pauseGame, resumeGame, prefersReducedMotion,
    telemetry: () => summarize(telemetry),
    /** Debug: jump `metres` further along the track (score, biome and the obstacle difficulty curve follow). */
    skip(metres) {
      game.z -= metres;
      game.dist += metres;
      obstacles.skipTo(game.z);
      game.score = Math.floor(game.dist * 0.75 + game.bonus);
      hud.setScore(game.score);
      world.setProgress(game.score);
    },
  };
}

boot();
