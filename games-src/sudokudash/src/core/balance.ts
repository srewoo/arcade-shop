// Pure Dash balance model: a simulated player placing every blank cell at a given pace.
// Used by the unit test (and handy for retuning src/config/dash.ts); the UI never imports it.
import { BALANCE } from '../config/dash';
import type { Rng } from './rng';
import type { Difficulty } from './grader';
import { dashCorrect, dashMistake, dashStart, dashTick, isTimeUp } from './scoring';

/** Pace (seconds per blank) at which the clock exactly breaks even, ignoring variance and the cap. */
export function breakEvenPace(difficulty: Difficulty, startSeconds: number, gainSeconds: number): number {
  return startSeconds / BALANCE.typicalBlanks[difficulty] + gainSeconds;
}

/** Time to finish at the level's reference pace, for the title screen ("par"). */
export const parSeconds = (difficulty: Difficulty): number => BALANCE.referencePace[difficulty] * BALANCE.typicalBlanks[difficulty];

/** Per-cell think time: mean `pace`, sd about half of it (a floor of half the pace plus an exponential tail). */
function thinkMs(pace: number, rng: Rng): number {
  const u = Math.min(0.999999, rng());
  return pace * 1000 * (0.5 - 0.5 * Math.log(1 - u));
}

/** Plays one grid; returns true if the clock ran out first. */
export function simulateRunLost(difficulty: Difficulty, pace: number, rng: Rng, mistakeRate: number = BALANCE.referenceMistakeRate): boolean {
  let s = dashStart(difficulty);
  let clock = 0;
  for (let i = 0; i < BALANCE.typicalBlanks[difficulty]; i++) {
    const t = thinkMs(pace, rng);
    clock += t;
    s = dashTick(s, t);
    if (isTimeUp(s)) return true;
    if (rng() < mistakeRate) {
      s = dashMistake(s);
      if (isTimeUp(s)) return true;
    }
    s = dashCorrect(s, clock, difficulty).state;
  }
  return false;
}

export function lossRate(difficulty: Difficulty, pace: number, rng: Rng, runs = 2000): number {
  let lost = 0;
  for (let i = 0; i < runs; i++) if (simulateRunLost(difficulty, pace, rng)) lost++;
  return lost / runs;
}
