// Per-run setup that depends on the selected mode, difficulty and settings.
import { MODES, effectiveRules, speedParams } from './modes.js';
import { difficultyMult } from './settings.js';
import { game, powers, settings } from './state.js';
import { obstacles, hud } from './systems.js';

/** Push the active mode's rules (power-ups, new obstacles, pickup pool) into the obstacle field. */
export function applyRules() {
  obstacles.rules = effectiveRules(game.mode, settings, difficultyMult(settings.difficulty));
}

/** Initialise speed, countdown, bonus and power-ups for a new run of the current mode. */
export function prepareRun() {
  const sp = speedParams(game.mode, difficultyMult(settings.difficulty));
  const limit = MODES[game.mode].timeLimit;
  Object.assign(game, {
    speed: sp.start, speedMin: sp.start, speedMax: sp.max, accel: sp.accel,
    bonus: 0, elapsed: 0, timeLeft: limit > 0 ? limit : Infinity, invuln: 0, airJumps: 0, airTime: 0, canDouble: false,
    hitObstacle: null, endTitle: 'GAME OVER',
  });
  obstacles.maxSpeed = sp.max;
  powers.clear();
  applyRules();
  hud.setMode(game.mode);
}

/** Re-prepare the title screen after a mode / difficulty / power-up change (re-spawns the first obstacles). */
export function refreshTitle() {
  prepareRun();
  obstacles.reset();
  obstacles.update(0, 0, game.speed);
}
