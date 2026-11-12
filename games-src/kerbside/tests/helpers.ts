import { NO_CONTROLS } from '../src/car';
import type { Controls } from '../src/car';
import { STEP } from '../src/config';
import type { Level } from '../src/levels/types';
import type { SimState } from '../src/sim';
import { createSim, stepSim } from '../src/sim';

export const LEVEL1 = (levels: readonly Level[]): Level => levels[0] as Level;

/** Run `seconds` of fixed steps with constant controls. */
export function run(level: Level, s: SimState, c: Controls, seconds: number): SimState {
  let cur = s;
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) cur = stepSim(cur, c, level, STEP);
  return cur;
}

export const fresh = (level: Level): SimState => createSim(level);
export { NO_CONTROLS };
