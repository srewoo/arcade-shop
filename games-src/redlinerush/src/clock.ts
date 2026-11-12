// Fixed-timestep accumulator shared by the frame loop and its tests.
import { CONFIG } from './config';

export interface ClockResult { steps: number; acc: number; alpha: number }

/** Add one frame's elapsed seconds (clamped) and split it into sim steps. */
export function advanceClock(acc: number, frameSeconds: number, step: number = CONFIG.step): ClockResult {
  let a = acc + Math.max(0, Math.min(CONFIG.maxFrame, frameSeconds));
  let steps = 0;
  while (a >= step) {
    a -= step;
    steps++;
  }
  return { steps, acc: a, alpha: a / step };
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
