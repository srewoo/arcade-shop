// All gameplay and feel tuning lives here (one place, no magic numbers elsewhere).
export const CONFIG = {
  sim: { step: 1 / 60, maxFrame: 0.1 },
  lane: {
    halfWidth: 150, gutterHalf: 184, deckHalf: 168,
    pinX: 1180, rowGap: 38, colGap: 46, backX: 1400, endX: 1460,
  },
  ball: {
    radius: 14, mass: 5, minSpeed: 560, maxSpeed: 1180, decel: 150, stopSpeed: 150,
    hookStartX: 380, curveAccel: 58, maxCurve: 3, maxAim: 0.2, restitution: 0.55,
  },
  cat: {
    radius: 15, mass: 1, lazyMass: 2.1, knockSpeed: 70, transfer: 0.72, moverKeep: 0.6,
    friction: 560, wobbleTime: 0.5, wobbleKeep: 0.55, jumpTime: 0.6, scareDist: 250,
    settleSpeed: 12, maxThrowTime: 9, hopPeriod: 0.42, coats: 6,
  },
  layout: { lazy: [1, 2], scaredy: [0, 2] },
  aim: { sweepMin: 1.7, sweepMax: 4.4, diff: { easy: 0.65, normal: 1, tricky: 1.3 } },
  power: { hz: 0.55, sweetLo: 0.6, sweetHi: 0.9 },
  frames: { count: 10, fishFrames: 3, fishPoints: 5, fishRadius: 17, fishMinX: 380, fishMaxX: 820, fishHalfY: 100 },
  flow: { resultSecs: 1.6, strikeSecs: 2.2, introSecs: 0 },
  fx: { shakeMs: 260, particles: 26, reducedParticleFactor: 0.35, yowlSecs: 1.1 },
  audio: { defaultVolume: 70, masterGain: 0.5 },
} as const;

export type Difficulty = keyof typeof CONFIG.aim.diff;
