// Fixed-timestep simulation tick. Rendering reads state and never mutates it.
import { clampAngle } from './aim';
import { TUNING } from './config';
import { updateEffects } from './effects';
import { Game, emit } from './state';
import { canShoot, fire, moveBall, nextArcadeLevel } from './shoot';

export const STEP = 1 / 60;
export const TURN_RATE = TUNING.aim.turnRate;

export interface Held {
  left: boolean;
  right: boolean;
}

function decayFx(g: Game, dt: number): void {
  const f = TUNING.fx;
  updateEffects(g.fx, dt);
  g.shake = Math.max(0, g.shake - dt * f.shakeDecay);
  g.prevDropAnim = g.dropAnim;
  g.dropAnim = Math.max(0, g.dropAnim - dt * f.dropSlide);
  g.recoil = Math.max(0, g.recoil - dt / f.recoilSeconds);
  g.flash = Math.max(0, g.flash - dt / f.flashSeconds);
}

/** Rush countdown: ends the run at zero and ticks once per second in the last seconds. */
function tickRush(g: Game, dt: number): boolean {
  g.timeLeft = Math.max(0, g.timeLeft - dt);
  if (g.timeLeft === 0) {
    g.status = 'finished';
    emit(g, 'finish');
    return true;
  }
  const sec = Math.ceil(g.timeLeft);
  if (sec > TUNING.rush.urgentSeconds) g.tickSecond = -1;
  else if (sec !== g.tickSecond) {
    g.tickSecond = sec;
    emit(g, 'tick', sec);
  }
  return false;
}

export function update(g: Game, dt: number, held: Held): void {
  decayFx(g, dt);
  if (g.status === 'cleared') {
    g.clearTimer -= dt;
    if (g.clearTimer <= 0) nextArcadeLevel(g);
    return;
  }
  if (g.status !== 'playing') return;
  const turn = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  if (turn) g.angle = clampAngle(g.angle + turn * TURN_RATE * dt);
  if (g.mode === 'rush' && tickRush(g, dt)) return;
  moveBall(g, dt);
  if (g.fireBuffer > 0) {
    g.fireBuffer = Math.max(0, g.fireBuffer - dt);
    if (canShoot(g)) fire(g);
  }
}
