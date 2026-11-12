// Fixed-timestep accumulator shared by the frame loop and its tests.
import { CONFIG } from './config';

export interface ClockResult {
  steps: number;
  acc: number;
  /** Blend factor (0..1) between the previous and current sim state for rendering. */
  alpha: number;
}

export function advanceClock(acc: number, frameSeconds: number, step: number = CONFIG.sim.step): ClockResult {
  let a = acc + Math.max(0, Math.min(CONFIG.sim.maxFrame, frameSeconds));
  let steps = 0;
  while (a >= step && steps < CONFIG.sim.maxCatchUp) {
    a -= step;
    steps++;
  }
  if (steps >= CONFIG.sim.maxCatchUp) a = Math.min(a, step);
  return { steps, acc: a, alpha: a / step };
}
