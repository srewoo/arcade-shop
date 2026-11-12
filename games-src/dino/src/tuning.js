// Single home for tuning numbers that used to be scattered through run.js, input.js, quality.js, camera.js,
// skins.js and the weather/obstacle modules.  The original Classic numbers stay in config.js (TUNING); everything
// Classic-related here is *derived* from TUNING, never a second literal, so the two can not drift apart.
import { TUNING } from './config.js';

/** Classic speed profile, taken from the original tuning table. */
export const CLASSIC = Object.freeze({ startSpeed: TUNING.startSpeed, maxSpeed: TUNING.maxSpeed, accel: TUNING.accel });

/** Ragdoll "hit stop": slow motion right after a crash, then ease back to real time. */
export const HITSTOP = Object.freeze({ minScale: 0.22, holdS: 0.1, rampS: 0.45 });

/** Touch / pointer thresholds (see input.js). */
export const INPUT = Object.freeze({ tapDecideMs: 65, swipeDownPx: 14, swipeUpPx: -21, swipeDownLatePx: 42, duckMinMs: 420 });

/**
 * Chase-camera framing.  `title` / `dead` offsets move the dino clear of the UI panel: portrait tilts the look-at up
 * (dino lower), landscape slides camera and look-at sideways (dino right of the left-hand panel), in world units at 16:10.
 */
export const CAMERA = Object.freeze({
  fovMin: 55,
  fovMax: 78,
  speedFovKick: 7,
  // follow-camera framing: [landscape value, portrait value], blended by how narrow the screen is
  framing: Object.freeze({ side: [2.7, 1.7], height: [3.3, 4.3], back: [7.2, 9.4] }),
  title: Object.freeze({ portraitLookY: 3.6, portraitBack: 2.2, landscapeShiftX: -3.8, landscapeLookY: 0.1 }),
  dead: Object.freeze({ portraitLookY: 2.6, landscapeShiftX: -2.4, landscapeLookY: 0.1 }),
  // presentation-only lift (world units) so cacti read above the dino's body; never applied to Classic on Normal with
  // power-ups off (see cameraMath.hazardLift), which keeps the original framing
  hazardLift: 0.55,
});

/** Hazard outline / ground telegraph (presentation only; no collision or spawn change). */
export const HAZARD = Object.freeze({ outlineColor: 0x24120a, outlineGrow: 0.085, markColor: 0xe8452c, markOpacity: 0.5 });

/** Adaptive quality governor: step down below downFps for one window, step back up after upHoldS above upFps. */
export const QUALITY = Object.freeze({ warmupS: 2, windowS: 2.5, downFps: 50, upFps: 58, upHoldS: 10, maxSteps: 3, maxFrameS: 0.25 });

/**
 * New-obstacle gates in seconds of run time (Classic Plus / other modes only; Classic keeps the original table).
 * They are converted to distances per mode and difficulty (obstacles/difficulty.js) so every mode meets each new
 * obstacle after the same amount of play.
 */
export const GATES = Object.freeze({
  boulder: Object.freeze({ atS: 15, weight: 1.6 }),
  log: Object.freeze({ atS: 25, weight: 1.4 }),
  meteor: Object.freeze({ atS: 40, weight: 1.0 }),
  rampS: 20,
  breatherEveryS: 25,
  breatherGapMult: 1.5,
});

/** Run flow around crash, game over and pause. */
export const FLOW = Object.freeze({
  crashSkipAtS: 0.8, // jump / tap during the ragdoll may skip to the game-over card after this long
  overInputGuardS: 0.3, // a restart press right after the card appears is ignored (no accidental restart)
  overFocusDelayS: 0.35, // focus moves to RUN IT BACK after this delay so a mashed Space does not restart
  resumeGraceS: 0.9, // 3-2-1 after resuming (countdowns and the simulation are frozen meanwhile)
  newBestMinScore: 50,
});

/** First-run coaching. */
export const COACH = Object.freeze({ duckWithinM: 25, showMs: 4200, hintsAutoHideS: 5 });

/** Skin unlock thresholds (best score in a skill mode). */
export const SKIN_UNLOCKS = Object.freeze({ ember: 500, frost: 1000, toxic: 2000, royal: 4000 });

/** Environment particle counts per quality (before the mobile / reduced-motion factors). */
export const WEATHER_COUNTS = Object.freeze({
  snow: Object.freeze({ auto: 900, high: 1400, medium: 800, low: 320 }),
  rain: Object.freeze({ auto: 1000, high: 1600, medium: 900, low: 380 }),
});
export const WEATHER_FACTORS = Object.freeze({ reducedCount: 0.4, reducedSpeed: 0.4, mobileCount: 0.6 });

/** Audio: polyphony cap and the master limiter. */
export const AUDIO = Object.freeze({
  maxVoices: 8,
  limiter: Object.freeze({ threshold: -12, ratio: 8, knee: 6, attack: 0.003, release: 0.2 }),
  queueMaxAgeMs: 400,
  ambienceGain: 0.05,
});

/** Juice. */
export const JUICE = Object.freeze({ pickupBurst: 12, confettiCount: 46, confettiMs: 2000, newBestFovKick: 5, flashMs: 380 });

export { POWERUPS } from './powerups.js';
