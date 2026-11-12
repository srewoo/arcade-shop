// Fixed-timestep accumulator shared by the frame loop and its tests.
import { STEP } from './update';

export interface ClockResult {
  /** Whole simulation steps to run this frame. */
  steps: number;
  /** Leftover time carried to the next frame. */
  acc: number;
  /** Blend factor (0..1) between the previous and current sim state for rendering. */
  alpha: number;
}

/** Add one frame's elapsed seconds (clamped to 0.1 s) and split it into sim steps. */
export function advanceClock(acc: number, frameSeconds: number, step = STEP): ClockResult {
  let a = acc + Math.max(0, Math.min(0.1, frameSeconds));
  let steps = 0;
  while (a >= step) {
    a -= step;
    steps++;
  }
  return { steps, acc: a, alpha: a / step };
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export type Phase = 'menu' | 'play' | 'pause' | 'result' | 'coach';

/** The simulation (and every timer in it) runs only in these phases: never while paused or in the coach card. */
export const shouldSimulate = (phase: Phase): boolean => phase === 'play' || phase === 'menu' || phase === 'result';
