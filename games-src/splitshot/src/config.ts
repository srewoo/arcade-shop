// All gameplay and feel tuning lives here. World units: 640 x 400, y grows downward.
export const CONFIG = {
  world: { w: 640, h: 400, floorY: 360, ceilY: 14 },
  sim: { dt: 1 / 60, maxFrame: 0.1, maxSteps: 6 },
  physics: { gravity: 560 },
  bubble: {
    /** Index = size: 0 tiny, 1 small, 2 medium, 3 large. */
    radius: [8, 13, 20, 30] as readonly number[],
    /** Apex height (above the surface the bubble bounced on) per size. */
    bounceHeight: [62, 104, 148, 192] as readonly number[],
    hSpeed: [98, 86, 74, 62] as readonly number[],
    splitKick: 170,
    maxSize: 3,
  },
  player: { speed: 170, w: 18, h: 36, hitW: 12, hitH: 28, startInvuln: 1.4, afterShieldInvuln: 1.2 },
  line: { speed: 400, width: 3, baseMax: 1, doubleMax: 2, fireCooldown: 0.12, stickyHold: 1.7, startOffset: 14 },
  power: {
    dropChance: 0.2,
    maxOnField: 2,
    lifeSec: 7,
    size: 11,
    duration: { double: 14, sticky: 14, slow: 8 },
    slowScale: 0.45,
    /** Weights for the random pick (order matches POWER_KINDS). */
    weights: [3, 3, 2, 2] as readonly number[],
  },
  score: {
    pop: [200, 150, 100, 50] as readonly number[],
    comboWindow: 1.1,
    comboStep: 3,
    comboMax: 4,
    timeBonusPerSec: 25,
    pickup: 100,
    blockBreak: 60,
    extraLifeEvery: 15000,
  },
  run: { lives: 3, maxLives: 6, loopTimeCut: 5, minTime: 40, loopSpeedStep: 0.06, loopSpeedMax: 1.3 },
  phases: { clearSec: 2.0, lostSec: 1.3 },
  fx: { maxParticles: 520, reducedFactor: 0.4, shake: 7 },
  audio: { defaultVolume: 70, masterGain: 0.5 },
  view: { hudTop: 58, touchBottom: 132 },
} as const;
