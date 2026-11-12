// Shared mutable game state.  Bundle symbols: fh query, ph coarse, mh highQuality, `$` game, kh debug, jh focus.
import * as THREE from 'three';
import { TUNING } from './config.js';
import { PowerupState } from './powerups.js';
import { loadSettings } from './storage.js';

const query = new URLSearchParams(location.search);

/** URL flags: ?auto (start in autoplay), ?ui=0 (hide UI), ?quality=high (disable adaptive quality drop). */
export const params = {
  coarsePointer: matchMedia('(pointer: coarse)').matches,
  highQuality: query.get('quality') === 'high',
  autoplay: query.has('auto'),
  uiHidden: query.get('ui') === '0',
  // ?debug=1 (or the dev server) exposes window.__dino; ?fps shows the frame-time overlay.
  debug: query.get('debug') === '1' || Boolean(import.meta.env?.DEV),
  fps: query.has('fps'),
};

/** User settings (validated on load, persisted by ui-settings.js).  Includes the last selected mode. */
export const settings = loadSettings();

/** Active power-up timers. */
export const powers = new PowerupState();

/**
 * Gameplay state.  The player never moves in x; world z runs toward negative values (the dino runs toward -z,
 * the camera sits at +z behind it).
 *   state: 'loading' | 'title' | 'running' | 'paused' | 'stumble' (Zen) | 'crashed' (ragdoll playing) | 'gameover'
 *   (legal moves: stateMachine.js)
 */
export const game = {
  state: 'loading',
  z: 0,
  y: 0, // height above ground
  vy: 0,
  grounded: true,
  duck: false,
  speed: TUNING.startSpeed,
  speedMin: TUNING.startSpeed, // start / top speed and acceleration of the current mode x difficulty
  speedMax: TUNING.maxSpeed,
  accel: TUNING.accel,
  mode: settings.mode,
  menuOpen: false, // settings panel is open (game input ignored)
  bonus: 0, // extra score from Score x2 (score = floor(dist * scorePerMeter + bonus))
  elapsed: 0, // real seconds since run start (countdown clock)
  timeLeft: Infinity, // Time Attack countdown
  invuln: 0, // seconds of invulnerability left (after a shield break / Zen stumble)
  airJumps: 0, // Double Jump charges left in this air time
  airTime: 0, // seconds since leaving the ground
  canDouble: false, // Double Jump active (read by the autopilot)
  hitObstacle: null, // obstacle that tripped the dino in Zen
  endTitle: 'GAME OVER',
  dist: 0, // metres run
  score: 0, // floor(dist * scorePerMeter)
  runTime: 0, // seconds since run start
  crashT: 0, // seconds since crash
  overT: 0, // seconds since game over (autoplay auto-restart timer)
  jumpBuffer: 0,
  hitKind: null, // kind of obstacle that killed us
  newBest: false,
  runRank: null, // ranking inputs frozen at run start (ranking.js snapshotRun), tainted by mid-run settings changes
  pausedFrom: null, // state to return to when a pause ends ('running' | 'stumble')
  pauseReason: null, // 'manual' | 'blur' | 'hidden'
  resumeGrace: 0, // seconds of 3-2-1 left after a resume (simulation frozen)
  stats: { pickups: 0 }, // per-run summary figures (cleared obstacles come from the field)
  startQueued: false, // a START press made while the engine was still loading; main.js fires it when ready
  physicsReady: false, // Rapier is loaded after the first paint; a run can not start before it is
  autoplay: params.autoplay,
  uiHidden: params.uiHidden,
};

/** Debug switches (exposed via window.__dino.debug). */
export const debug = { paused: false, invincible: false };

/** What the camera follows / the shadow frustum centres on (player, or ragdoll torso after a crash). */
export const focus = new THREE.Vector3();
