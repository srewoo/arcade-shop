// Input grace: a freshly shown dialog or grid ignores activations for a short moment, so key
// or click spam aimed at the previous screen cannot hit the new one.
import { INPUT } from './config/input';

export interface Grace {
  /** Restart the grace window (call when the screen appears). */
  arm: (now?: number) => void;
  /** True while activations should be ignored. */
  blocked: (now?: number) => boolean;
}

export function makeGrace(ms: number = INPUT.graceMs): Grace {
  let until = 0;
  return {
    arm: (now = performance.now()) => { until = now + ms; },
    blocked: (now = performance.now()) => now < until,
  };
}
