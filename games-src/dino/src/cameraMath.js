// Pure camera helpers (no three / DOM).
import { CAMERA } from './tuning.js';

/** Classic on Normal difficulty without Classic Plus is the "original" configuration: its framing never changes. */
export function isOriginalFraming({ mode, difficulty, classicPlus }) {
  return mode === 'classic' && difficulty === 'normal' && !classicPlus;
}

/**
 * Extra camera height (world units) so hazards clear the dino's body in the other modes / difficulties.
 * Presentation only: collision, spawning, speed and timing never read the camera.
 */
export function hazardLift(cfg, base = CAMERA.hazardLift) {
  return isOriginalFraming(cfg) ? 0 : base;
}
