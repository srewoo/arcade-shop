// All gameplay tuning in one place. Physical lane/ball constants stay in constants.ts.

export type CpuLevel = 'casual' | 'easy' | 'pro';

export interface CpuProfile {
  readonly candidates: number;
  readonly xNoise: number;
  readonly aimNoise: number;
  readonly powerNoise: number;
  readonly spinNoise: number;
}

export const TUNING = {
  timing: {
    settleS: 0.9,
    sweepS: 0.8,
    cpuThinkS: 0.9,
    cpuAimS: 0.8,
    bannerS: 1.7,
    bannerQuietS: 0.3,
    bannerShowMs: 1600,
    calloutShowMs: 1300,
    moveCmPerS: 60,
    nudgeCm: 3,
    /** Non-physics waits run this many times faster when skipped or on fast CPU turns. */
    fastForward: 4,
    /** Render-only freeze on the first ball-pin contact. */
    hitStopS: 0.07,
    /** After a human throw, the banner wait cannot be skipped until it has run this long. */
    skipGuardS: 0.6,
    /** Pause between the last pin falling and the results card, so the payoff plays first. */
    resultsDelayMs: 1500,
    resultsDelayQuietMs: 900,
    resultsDelayReducedMs: 500,
  },
  meters: {
    aimHz: 0.42,
    powerHz: 0.75,
    spinHz: 0.65,
    /** Aim = MAX_AIM * |u|^exp: a flat centre makes the pocket window wide in time. */
    aimExp: 2,
    aimExpAssist: 4,
    spinExp: 2,
    spinExpAssist: 3,
    /** Half-width (rad) of the aim band that can strike from the pocket line. */
    strikeBandRad: 0.005,
    /** Ball start x (cm) that lines up with the pocket, either side of centre. */
    pocketX: 9,
    /** Head-pin-line distance (cm) from the pocket target that still counts as "Pocket!". */
    pocketWindowCm: 3.5,
    reducedSlow: 0.7,
  },
  cpu: {
    casual: { candidates: 1, xNoise: 8, aimNoise: 0.02, powerNoise: 0.25, spinNoise: 0.4 },
    easy: { candidates: 4, xNoise: 6, aimNoise: 0.0035, powerNoise: 0.14, spinNoise: 0.3 },
    pro: { candidates: 22, xNoise: 0.8, aimNoise: 0.0007, powerNoise: 0.02, spinNoise: 0.04 },
  } satisfies Record<CpuLevel, CpuProfile>,
  juice: {
    shakePerStrength: 1 / 4000,
    shakeDecay: 2.4,
    strikeShake: 0.6,
    gutterShake: 0.3,
    burstMax: 14,
    burstStrikeMax: 30,
    particleCap: 400,
    reducedIntensity: 0.3,
    gravity: 420,
    ringLife: 0.45,
    confettiCount: 70,
    /** Crash splinters: launch speed, life and size ranges. */
    burst: { speedMin: 30, speedRange: 120, lifeMin: 0.35, lifeRange: 0.4, sizeMin: 1.5, sizeRange: 2.5 },
    /** Canvas shake amplitude in px at shake = 1. */
    shakePx: 7,
  },
  camera: {
    d0: 220,
    k: 0.38,
    /** Depth factor beyond the rack break so the front rows separate. */
    kRack: 0.7,
    /** Extra screen lift (cm of height per cm of depth) across the rack so the three front rows separate. */
    rackLift: 0.45,
    rackLiftCap: 150,
    rackBreakBack: 80,
    heightBoost: 1.2,
    followRate: 10,
    idleRate: 2.5,
  },
  input: {
    tapPx: 14,
    decidePx: 12,
    dragHintThrows: 3,
  },
  stats: {
    spareStars: [15, 25, 35] as readonly number[],
  },
} as const;
