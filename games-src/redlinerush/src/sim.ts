// Fixed-step simulation: create + step. Movement lives in simPlayer, traffic and
// pickups in simWorld; this file wires phases, modes and end conditions.
import { CONFIG } from './config';
import { finishBonus } from './scoring';
import { stepPlayer } from './simPlayer';
import { type Input, type Mode, type Sim } from './simTypes';
import { stepWorld } from './simWorld';
import { createTrack } from './track';

export const usesFuel = (mode: Mode): boolean => mode !== 'trial';

export function createSim(mode: Mode, seed: number): Sim {
  return {
    mode, seed, track: createTrack(seed), phase: 'countdown', outcome: null,
    countdown: CONFIG.countdownBeat * 3, overT: 0, runT: 0,
    z: 0, pz: 0, x: CONFIG.lanes / 2, px: CONFIG.lanes / 2, vx: 0,
    speed: CONFIG.player.startSpeed, boost: 0, invuln: 0, lives: CONFIG.player.lives,
    fuel: CONFIG.fuel.max, lowWarned: false, distScore: 0, bonus: 0, combo: 0, comboT: 0,
    maxCombo: 0, nearMisses: 0, crashes: 0,
    timeLeft: mode === 'trial' ? CONFIG.trial.startTime : 0, checkpoint: 0,
    nextId: 1, cars: [], pickups: [], events: [],
  };
}

export const score = (s: Sim): number => Math.floor(s.distScore + s.bonus);

export function endRun(s: Sim, outcome: NonNullable<Sim['outcome']>): void {
  if (s.phase === 'over') return;
  s.phase = 'over';
  s.outcome = outcome;
  s.events.push({ type: 'over', outcome });
}

function stepCountdown(s: Sim, dt: number): void {
  const beat = CONFIG.countdownBeat;
  const beats = (t: number): number => Math.ceil(t / beat - 1e-9);
  const before = beats(s.countdown);
  s.countdown = Math.max(0, s.countdown - dt);
  const after = beats(s.countdown);
  if (after !== before && after > 0) s.events.push({ type: 'count', n: after });
  if (s.countdown === 0) {
    s.phase = 'run';
    s.events.push({ type: 'go' });
  }
}

/** Trial rules: checkpoints add time; the last one is the finish line. */
function stepTrial(s: Sim, dt: number): void {
  s.timeLeft -= dt;
  const cfg = CONFIG.trial;
  const seg = cfg.length / cfg.checkpoints;
  if (s.z >= (s.checkpoint + 1) * seg) {
    s.checkpoint++;
    if (s.checkpoint >= cfg.checkpoints) {
      s.bonus += finishBonus(s.timeLeft);
      s.events.push({ type: 'checkpoint', index: s.checkpoint, of: cfg.checkpoints, bonus: 0 });
      endRun(s, 'finish');
      return;
    }
    s.timeLeft += cfg.bonusTime;
    s.events.push({ type: 'checkpoint', index: s.checkpoint, of: cfg.checkpoints, bonus: cfg.bonusTime });
  }
  if (s.timeLeft <= 0) {
    s.timeLeft = 0;
    endRun(s, 'time');
  }
}

export function step(s: Sim, input: Input, dt: number = CONFIG.step): void {
  s.pz = s.z;
  s.px = s.x;
  for (const c of s.cars) c.pz = c.z;
  if (s.phase === 'over') {
    s.overT += dt;
    return;
  }
  if (s.phase === 'countdown') {
    stepCountdown(s, dt);
    return;
  }
  s.runT += dt;
  const dz = stepPlayer(s, input, dt, usesFuel(s.mode));
  s.distScore += dz * CONFIG.scoring.perUnit;
  stepWorld(s, dt);
  if (s.phase === 'run' && usesFuel(s.mode) && s.fuel <= 0) endRun(s, 'fuel');
  if (s.phase === 'run' && s.lives <= 0) endRun(s, 'crash');
  if (s.phase === 'run' && s.mode === 'trial') stepTrial(s, dt);
}
