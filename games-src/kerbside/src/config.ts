// All gameplay tuning lives here (CONVENTIONS section 6). Units: metres, seconds, radians.
export const CONFIG = Object.freeze({
  sim: { stepHz: 60, maxFrameMs: 100, maxStepsPerFrame: 6 },
  car: {
    length: 4.3,
    width: 1.8,
    wheelbase: 2.6,
    /** Body centre is this far ahead of the rear axle. */
    centreOffset: 1.3,
    maxSteer: 0.62,
    steerRate: 2.0,
    centreRate: 2.6,
    accel: 4.6,
    reverseAccel: 3.6,
    brake: 10,
    handbrake: 14,
    maxForward: 6.5,
    maxReverse: 3.4,
    rolling: 0.5,
    drag: 0.12,
    bounce: 0.28,
  },
  trailer: {
    hitchBehindAxle: 1.1,
    /** Hitch to trailer axle (axle sits at the middle of the body). */
    drawbar: 2.2,
    length: 3.6,
    width: 1.8,
    /** Relative angle past which the rig has folded (counts as a crash). */
    jackknife: 1.35,
    maxForward: 5,
    maxReverse: 2.6,
  },
  parking: {
    maxAngleDeg: 12,
    maxSpeed: 0.12,
    holdSeconds: 0.7,
    insideTolerance: 0.02,
    /** Park only counts with this much air around the rig, so pinning the car on a wall does not park it. */
    clearance: 0.12,
  },
  damage: { hitCooldown: 0.7, wreckAt: 5 },
  scoring: { base: 1000, perSecondLeft: 20, perDamage: 150, minScore: 100 },
  solver: { margin: 0.1, cell: 0.3, headingBins: 48, maxNodes: 220000, weight: 1.6 },
  camera: { margin: 1 },
  audio: { defaultVolume: 70, master: 0.5, engineGain: 0.05 },
  ui: { toastMs: 2200, resultDelayMs: 650, payoffMs: 1300, hintAfterMs: 400, hintMs: 9000 },
  fx: { shakeMs: 260, particleBase: 14, skidMarks: 90 },
});
export const STEP = 1 / CONFIG.sim.stepHz;
