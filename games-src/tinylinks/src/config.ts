// All gameplay and feel tuning lives here. Units: world units (u), seconds.
export const CONFIG = {
  sim: { dt: 1 / 120, maxFrameSec: 0.25, maxStepsPerFrame: 40 },
  world: { w: 800, h: 500 },
  ball: { r: 6 },
  wall: { half: 4, restitution: 0.74, softBelow: 40, softRestitution: 0.3, postRestitution: 0.9 },
  /** Constant rolling deceleration (u/s^2) per surface, plus viscous drag (1/s). */
  friction: { grass: 150, sand: 640, drag: 0.22 },
  /** A resting ball stays put while the slope acceleration is at or below this. */
  slope: { hold: 200 },
  stop: { speed: 14, restTicks: 48, maxRollSec: 30 },
  shot: { maxSpeed: 540, minPower: 0.04, maxStrokes: 8, waterPenalty: 1 },
  cup: { r: 8.5, sinkSpeed: 250, pullR: 15, pull: 320 },
  aim: {
    /** Screen pixels of drag-back for full power; shorter than deadzone cancels. */
    dragFull: 150,
    deadzone: 14,
    keyAngleStep: 0.03,
    keyAngleFine: 0.006,
    keyPowerStep: 0.05,
    keyPowerFine: 0.01,
    defaultPower: 0.55,
    guideBase: 60,
    guideSpan: 170,
  },
  flow: { sinkSec: 1.1, waterSec: 0.8, pickupSec: 0.9, maxPlayers: 4 },
  fx: { maxParticles: 160, reducedFactor: 0.4, calloutSec: 1.8 },
  audio: { defaultVolume: 70, masterGain: 0.5, cueGain: 0.22 },
} as const;
