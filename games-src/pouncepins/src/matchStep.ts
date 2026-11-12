// Per-tick match update (fixed step). Kept apart from match.ts to stay small.
import { CONFIG } from './config';
import { advanceTurn, finishRoll, resultDuration, type Match } from './match';
import { stepWorld } from './physics';

const TAU = Math.PI * 2;

/** Triangle wave 0..1..0 for the power meter. */
export const triangle = (phase: number): number => 1 - Math.abs(((phase % 1) + 1) % 1 * 2 - 1);

function drainWorld(m: Match): void {
  for (const e of m.world.events) {
    if (e.type === 'fish') {
      m.fishThisBall = true;
      const p = m.players[m.current];
      if (p) p.fish++;
    }
    m.events.push(e);
  }
  m.world.events.length = 0;
}

/** Advance the match by one fixed step. */
export function stepMatch(m: Match, dt: number): void {
  m.phaseT += dt;
  if (m.phase === 'aim') {
    m.aim.prev = m.aim.angle;
    m.aim.phase = (m.aim.phase + m.aim.speed * dt) % TAU;
    m.aim.angle = Math.sin(m.aim.phase) * CONFIG.ball.maxAim;
  } else if (m.phase === 'power') {
    m.power.prev = m.power.value;
    m.power.phase += CONFIG.power.hz * dt;
    m.power.value = triangle(m.power.phase);
  } else if (m.phase === 'rolling') {
    stepWorld(m.world, dt);
    drainWorld(m);
    if (m.world.settled) finishRoll(m);
  } else if (m.phase === 'result' && m.phaseT >= resultDuration(m)) {
    advanceTurn(m);
  }
}
