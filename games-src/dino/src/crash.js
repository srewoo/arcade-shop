// What happens when the dino touches an obstacle (crash / Shield / Zen stumble) and how a run ends.
// Bundle function `Wh` (crash) plus the new Shield and Zen outcomes.
import * as THREE from 'three';
import { rand } from './util.js';
import { hitOutcome } from './modes.js';
import { SHIELD_GRACE, STUMBLE_TIME, STUMBLE_GRACE } from './powerups.js';
import { game, powers, debug } from './state.js';
import { dino, obstacles, puffs, shake, sim, bubble } from './systems.js';
import { events } from './events.js';
import { go } from './flow.js';
import { records } from './records.js';
import { telemetry, recordDeath } from './telemetry.js';

const LEG_BODIES = ['thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR'];
const _p = new THREE.Vector3();

/** Hand the dino to the ragdoll and kick it.  `tame` (Zen) keeps it close to where it fell. */
function startRagdoll(obstacle, tame) {
  dino.detach();
  sim.start(dino.list, obstacles.physicsProps(obstacle, game.z), { legPhase: dino.phase });
  const k = tame ? 0.45 : 1;
  sim.nudge({ x: rand(-1.5, 1.5) * k, y: rand(0.5, 4) * k, z: 0 }, { x: rand(-4.5, 1) * k, y: rand(-2.5, 2.5) * k, z: rand(-2.5, 2.5) * k });
  if (tame) sim.scaleVelocity(dino.list.map((p) => p.def.name), 0.3);
  if (obstacle.kind === 'weed') {
    // tumbleweed: legs get swept from under the dino -> extra forward flip
    sim.scaleVelocity(LEG_BODIES, 0.25);
    sim.nudge({ x: 0, y: 2, z: 0 }, { x: -5, y: 0, z: 0 });
  }
  shake.add(tame ? 0.55 : 0.85);
  events.emit('hit', { kind: obstacle.kind, tame });
  dino.knock(1);
  puffs.puff(_p.set(0, Math.min(1, obstacle.y0 + 0.4), game.z - 0.8), 10, 1.4, -game.speed);
}

/** Obstacle hit: freeze the animated dino, hand its bones to Rapier and kick it. */
function crash(obstacle) {
  if (!go('crashed')) return;
  game.crashT = 0;
  game.hitKind = obstacle.kind;
  game.newBest = records.submit(game.mode, game.score);
  recordDeath(telemetry, obstacle.kind, game.runTime);
  bubble.hide();
  startRagdoll(obstacle, false);
}

/** Zen: tumble for STUMBLE_TIME, then get back up (see recoverFromStumble). */
function stumble(obstacle) {
  if (!go('stumble')) return;
  game.crashT = 0;
  game.hitObstacle = obstacle;
  game.invuln = STUMBLE_TIME + STUMBLE_GRACE;
  startRagdoll(obstacle, true);
}

/** Shield absorbs the hit: the obstacle is smashed and the bubble pops. */
function shieldBreak(obstacle) {
  powers.consumeShield();
  game.invuln = SHIELD_GRACE;
  bubble.pop();
  puffs.puff(_p.set(0, Math.max(0.6, obstacle.y0 + 0.5), obstacle.z), 12, 1.6, -game.speed * 0.4);
  obstacles.destroy(obstacle);
  shake.add(0.4);
  events.emit('shieldBreak', { z: obstacle.z });
}

/** Called each frame by the stumble state: the ragdoll stays where it fell, the run clock keeps moving the camera. */
export function recoverFromStumble() {
  game.z = Math.min(game.z, sim.torsoPos.z);
  sim.dispose();
  dino.reset();
  if (game.hitObstacle) obstacles.destroy(game.hitObstacle);
  for (const o of [...obstacles.list]) if (o.ragdolled) obstacles.destroy(o);
  game.hitObstacle = null;
  go('running');
  events.emit('recover');
  game.speed = Math.max(game.speedMin, game.speed * 0.6);
  game.vy = 0;
  game.y = 0;
  game.grounded = true;
  game.jumpBuffer = 0;
  game.canDouble = false;
}

/** Route a collision to the right outcome for the current mode / power-ups. */
export function handleHit(obstacle) {
  if (debug.invincible) return;
  const outcome = hitOutcome(game.mode, { shield: powers.has('shield'), invulnerable: game.invuln > 0 });
  if (outcome === 'shield') shieldBreak(obstacle);
  else if (outcome === 'stumble') stumble(obstacle);
  else if (outcome === 'crash') crash(obstacle);
}

/** End the run without a ragdoll (Time Attack time up, or ending a Zen run on purpose). */
export function finishRun(title) {
  if (game.state !== 'running' || !go('gameover')) return;
  game.overT = 0;
  game.endTitle = title;
  game.hitKind = null;
  game.newBest = records.submit(game.mode, game.score);
  bubble.hide();
  events.emit('gameover', { title, score: game.score, newBest: game.newBest, killer: null });
}
