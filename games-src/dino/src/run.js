// Game state machine and per-frame simulation.  Bundle functions: Vh resetRun, Hh startRun, Wh crash, Gh tickRunning,
// Kh tickCrashed, qh tick, Uh idlePose.
//
//   loading -> title --(jump/Enter/tap or ?auto)--> running --(obstacle hit)--> crashed --(2 s, or a press after 0.8 s)--> gameover
//                                                      ^   \--(Zen hit)--> stumble --(1.3 s)--> running     |
//                                                      +----------------- jump / button --------------+
// running / stumble <-> paused (pause.js).  Every move goes through stateMachine.js (legal-transition table).
// The run emits events (score, milestone, pickup, gameover, ...); feedback.js turns them into HUD, sound and particles.
// Time Attack ends a run with 'gameover' directly when the clock hits 0.  In autoplay, gameover auto-restarts
// after TUNING.autoRestartDelay.  Power-ups, modes and settings are described in CHANGES.md.
import * as THREE from 'three';
import { TUNING } from './config.js';
import { HITSTOP, FLOW } from './tuning.js';
import { clamp, lerp } from './util.js';
import { game, focus, powers, settings } from './state.js';
import { dino, obstacles, puffs, shake, sim, audio, input, autopilot, hud, world, camera, bubble } from './systems.js';
import { updateCamera } from './camera.js';
import { MODES, timeRemaining } from './modes.js';
import { bonusDelta, scoreFrom, AIR_JUMP_POWER, STUMBLE_TIME } from './powerups.js';
import { events } from './events.js';
import { go } from './flow.js';
import { hintFlags } from './runFlags.js';
import { warnExpiring, warnClock, coach, resumeCountdown } from './runAlerts.js';
import { gravityScale } from './world/weatherModes.js';
import { prepareRun } from './session.js';
import { snapshotRun } from './ranking.js';
import { handleHit, recoverFromStumble, finishRun } from './crash.js';

const _p = new THREE.Vector3();
const MIN_SLOWMO = HITSTOP.minScale; // ragdoll time scale right after the crash ("hit stop")
const SLOWMO_HOLD = HITSTOP.holdS; // seconds at MIN_SLOWMO
const SLOWMO_RAMP = HITSTOP.rampS; // seconds to ramp back to real time

// The rig only reads its pose, so the title / reset pose is one shared object and the run pose one reused scratch object
// (no allocation per frame).
const IDLE_POSE = Object.freeze({ mode: 'idle', z: 0, y: 0, vy: 0, grounded: true, duck: false, speed: 0 });
const RUN_POSE = { mode: 'run', z: 0, y: 0, vy: 0, grounded: true, duck: false, speed: 0 };
export const idlePose = () => IDLE_POSE;

function setPose(mode, y, vy, grounded, duck, speed) {
  RUN_POSE.mode = mode;
  RUN_POSE.z = game.z;
  RUN_POSE.y = y;
  RUN_POSE.vy = vy;
  RUN_POSE.grounded = grounded;
  RUN_POSE.duck = duck;
  RUN_POSE.speed = speed;
  return RUN_POSE;
}

/** Reset everything for a fresh run (also used once at boot). */
export function resetRun() {
  sim.dispose();
  dino.reset();
  obstacles.reset();
  world.reset(0);
  puffs.clear();
  autopilot.reset();
  bubble.hide();
  dino.rig.visible = true;
  Object.assign(game, {
    z: 0, y: 0, vy: 0, grounded: true, duck: false, dist: 0, score: 0,
    runTime: 0, crashT: 0, overT: 0, jumpBuffer: 0, hitKind: null, newBest: false, resumeGrace: 0, pausedFrom: null,
  });
  game.stats.pickups = 0;
  hintFlags.reset();
  prepareRun(); // speed / countdown / power-ups for the selected mode
  obstacles.update(0, 0, game.speed); // pre-spawn the first obstacles
  hud.setScore(0);
  hud.hideGameOver();
  hud.setClock(game.timeLeft);
  focus.set(0, 0, 0);
  dino.update(0, idlePose());
  updateCamera(0, true);
}

export function startRun() {
  if (game.state === 'loading') return;
  if (game.state !== 'title') resetRun();
  if (!go('running')) return;
  game.runRank = snapshotRun(settings, game.mode);
  hud.showTitle(false);
  hud.setRunning(true);
  events.emit('runStart', { auto: game.autoplay });
}

/** Game over -> title screen (mode / settings can be changed there). */
export function backToTitle() {
  resetRun();
  go('title');
  hud.showTitle(true);
  hud.setRunning(false);
}

export function wireCallbacks() {
  sim.onImpact = (strength, pos) => {
    shake.add(0.2 + 0.5 * strength);
    audio.thud(strength);
    dino.knock(strength);
    if (pos.y < 1.6) puffs.puff(pos, Math.round(3 + 8 * strength), 0.8 + strength, 0);
  };
  dino.onStep = (side, pos) => {
    audio.step(side);
    puffs.puff(pos, 2, 0.5, 0);
  };
  obstacles.onMeteorLand = (o) => {
    shake.add(0.35);
    audio.meteor();
    puffs.puff(_p.set(0, 0.6, o.z), 14, 1.8, 0);
  };
}

/** Human or autopilot decisions for this frame: { jump, duck, air } (air = spend a Double Jump charge). */
function readInput(dt) {
  game.canDouble = powers.has('doublejump');
  if (game.autoplay) {
    const a = autopilot.update(game, obstacles);
    return { jump: a.jump, duck: a.duck, air: a.airJump };
  }
  game.jumpBuffer -= dt;
  return { jump: game.jumpBuffer > 0 || input.jumpHeld, duck: input.duck, air: game.jumpBuffer > 0 };
}

/** Ground jump, mid-air Double Jump, gravity and landing. */
function integrateJump(dt, want) {
  if (want.jump && game.grounded) {
    game.vy = TUNING.jumpVel;
    game.grounded = false;
    game.airJumps = 1;
    game.airTime = 0;
    game.jumpBuffer = 0;
    dino.jumped();
    audio.jump();
    puffs.puff(_p.set(0, 0, game.z), 3, 0.8, 0);
  } else if (want.air && game.canDouble && !game.grounded && game.airJumps > 0 && game.airTime > 0.12) {
    game.vy = TUNING.jumpVel * AIR_JUMP_POWER;
    game.airJumps--;
    game.jumpBuffer = 0;
    dino.jumped();
    audio.airJump();
    puffs.puff(_p.set(0, game.y, game.z), 5, 0.9, 0);
  }
  if (game.grounded) return;
  game.airTime += dt;
  // Snow: slightly floatier descent (gravityScale is 1 in every other environment)
  game.vy -= (TUNING.gravity + (want.duck ? TUNING.fastFall : 0)) * gravityScale(settings.weather, game.vy) * dt;
  game.y += game.vy * dt;
  if (game.y > 0) return;
  const impact = -game.vy;
  game.y = 0;
  game.vy = 0;
  game.grounded = true;
  dino.landed(impact);
  audio.land();
  shake.add(0.12);
  puffs.puff(_p.set(0, 0, game.z - game.speed * dt), 6, 1, 0);
}

/** Score from distance (+ Score x2 bonus); chime and pop every 100 points. */
function updateScore(step) {
  game.bonus += bonusDelta(step, powers.scoreMultiplier(), TUNING.scorePerMeter);
  const score = scoreFrom(game.dist, game.bonus, TUNING.scorePerMeter);
  if (score === game.score) return;
  const milestone = Math.floor(score / 100) > Math.floor(game.score / 100);
  game.score = score;
  events.emit('score', score);
  if (milestone) events.emit('milestone', score);
  world.setProgress(score);
}

/** Pickups touched this frame start their power-up. */
function collectPickups(dt, boxes) {
  for (const kind of obstacles.pickups.collect(game.z, boxes, game.speed, dt)) {
    powers.grant(kind);
    game.stats.pickups++;
    events.emit('pickup', { kind, z: game.z });
  }
}

/** Real-time timers: power-ups, invulnerability (blinking dino unless reduced motion), elapsed clock. */
function tickClocks(rdt) {
  for (const id of powers.update(rdt)) events.emit('powerEnd', id);
  warnExpiring();
  game.invuln = Math.max(0, game.invuln - rdt);
  game.elapsed += rdt;
  dino.rig.visible = settings.reducedMotion || game.invuln <= 0 || Math.floor(game.elapsed * 14) % 2 === 0;
}

function tickRunning(rdt) {
  const dt = rdt * powers.timeScale(); // Slow-Mo scales gameplay (and below, physics) but not the timers
  game.runTime += dt;
  tickClocks(rdt);
  if (game.timeLeft !== Infinity) {
    game.timeLeft = timeRemaining(MODES[game.mode].timeLimit, game.elapsed);
    hud.setClock(game.timeLeft);
    warnClock();
    if (game.timeLeft <= 0) {
      dino.rig.visible = true;
      finishRun('TIME UP');
      return;
    }
  }
  game.speed = Math.min(game.speedMax, game.speed + game.accel * dt);
  const want = readInput(dt);
  if (want.duck && !game.duck && game.grounded) audio.duck();
  game.duck = want.duck;
  integrateJump(dt, want);
  const step = game.speed * dt;
  game.z -= step;
  game.dist += step;
  obstacles.update(dt, game.z, game.speed);
  dino.update(dt, setPose('run', game.y, game.vy, game.grounded, want.duck, game.speed));
  focus.set(0, game.y, game.z);
  updateScore(step);
  const boxes = dino.hitboxes(game.y, game.grounded); // one scratch set per frame, shared by pickups and obstacles
  collectPickups(dt, boxes);
  const hit = obstacles.hit(game.z, boxes, game.speed, dt);
  coach();
  if (hit) handleHit(hit);
}

/** Ragdoll finished (or was skipped): show the game-over card. */
function enterGameOver() {
  if (!go('gameover')) return;
  game.overT = 0;
  events.emit('gameover', { title: 'GAME OVER', score: game.score, newBest: game.newBest, killer: game.hitKind });
}

/**
 * Jump / tap during the ragdoll skips straight to the game-over card once FLOW.crashSkipAtS has passed.  The default
 * 2 s timing (TUNING.crashToGameOver, the original value) is untouched when the player does not press anything.
 */
export function skipCrash() {
  if (game.state !== 'crashed' || game.crashT < FLOW.crashSkipAtS) return false;
  enterGameOver();
  return true;
}

function tickCrashed(dt) {
  game.crashT += dt;
  // hit-stop: slow motion for 0.1 s, then ease back to real time over 0.45 s (Slow-Mo power-up slows it further)
  const timeScale = game.crashT < SLOWMO_HOLD ? MIN_SLOWMO : lerp(MIN_SLOWMO, 1, clamp((game.crashT - SLOWMO_HOLD) / SLOWMO_RAMP, 0, 1));
  const sdt = dt * timeScale * powers.timeScale();
  if (sim.active) {
    sim.step(sdt);
    focus.copy(sim.torsoPos);
  } else {
    dino.update(dt, setPose('idle', 0, 0, true, false, 0)); // run ended without a crash
  }
  obstacles.update(sdt, game.z, game.speed, false);
  if (sim.active) dino.updateFace(sdt);
  if (sim.torsoPos.y < 1.1 && sim.speed > 3.5 && sim.active && Math.random() < 0.55) puffs.puff(sim.torsoPos, 1, 0.7 + sim.speed * 0.04, 0);
  if (game.state === 'crashed' && game.crashT >= TUNING.crashToGameOver) enterGameOver();
  else if (game.state === 'gameover') {
    game.overT += dt;
    if (game.autoplay && game.overT >= TUNING.autoRestartDelay) startRun();
  }
}

/** Zen: the dino tumbles for STUMBLE_TIME, the world keeps going, then it gets back up (invulnerable for a while). */
function tickStumble(dt) {
  game.crashT += dt;
  powers.update(dt);
  game.invuln = Math.max(0, game.invuln - dt);
  const sdt = dt * powers.timeScale();
  sim.step(sdt);
  game.z = Math.min(game.z, sim.torsoPos.z);
  obstacles.update(sdt, game.z, game.speed);
  dino.updateFace(sdt);
  focus.copy(sim.torsoPos);
  if (game.crashT >= STUMBLE_TIME) recoverFromStumble();
}

/** One frame of game logic (dt already clamped by the caller). */
export function tick(dt) {
  if (game.state === 'paused') return; // frozen: the simulation, clocks and effects all wait
  if (game.resumeGrace > 0) {
    resumeCountdown(dt);
    return;
  }
  if (game.menuOpen && game.state !== 'title') return; // settings open over a run / game over: everything waits
  shake.update(dt);
  bubble.update(dt, powers.has('shield') && game.state === 'running', powers.fraction('shield'), performance.now() / 1000, settings.reducedMotion);
  if (game.state === 'title') {
    dino.update(dt, idlePose());
    if (game.autoplay && game.physicsReady) startRun();
  } else if (game.state === 'running') tickRunning(dt);
  else if (game.state === 'stumble') tickStumble(dt);
  else if (game.state === 'crashed' || game.state === 'gameover') tickCrashed(dt);
  hud.updatePowers(powers);
  world.speed = game.state === 'running' ? game.speed : 0;
  puffs.update(dt);
  updateCamera(dt);
  world.update(dt, focus, camera);
}
