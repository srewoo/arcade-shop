// All gameplay and feel tuning lives here. Units: lanes for lateral, "u" for road distance.
export const CONFIG = {
  step: 1 / 60,
  maxFrame: 0.1,
  countdownBeat: 0.8,
  view: { width: 400, height: 640, roadLeft: 60, laneW: 56, playerY: 470, pxPerU: 8 },
  lanes: 5,
  player: {
    halfW: 0.27, halfLen: 3.0, lives: 3, minSpeed: 10, startSpeed: 20,
    accel: 9, brake: 24, overspeedDecay: 6,
    // With no gas or brake the car keeps speeding up gently towards the current top speed (which itself rises to topCap).
    autoAccel: 2.5,
    steerMax: 4.2, steerAccel: 30, edgePad: 0.04, invuln: 1.8, hurtSpeed: 13,
  },
  speed: { baseTop: 32, topPerUnit: 0.004, topCap: 56, boostAdd: 10, boostAccelMul: 2, boostDur: 2.6 },
  traffic: {
    firstRowZ: 90, spawnAhead: 100, cullBehind: 40,
    spacingStart: 60, spacingEnd: 46, rampDist: 6000,
    laneSpeedBase: 13, laneSpeedStep: 0.5, maxCarsPerRow: 3,
    boostChance: 0.06, fuelEvery: 420, kinds: { van: 0.22, truck: 0.12 },
  },
  carLen: { sedan: 6.4, van: 7.6, truck: 10 },
  hitLenFrac: 0.45,
  fuel: { max: 100, drainBase: 1.0, drainPerSpeed: 0.05, pickup: 40, low: 25 },
  scoring: { perUnit: 0.5, near: 50, nearGap: 0.4, nearWindow: 7.5, comboWindow: 3, maxMult: 5, multEvery: 3, pickup: 25, boostMul: 2 },
  trial: { length: 3200, checkpoints: 5, startTime: 30, bonusTime: 16, finishPoints: 1000, timePoints: 50 },
  overDelay: 1.5,
  fx: { shakeMs: 320, particleMax: 200, floatMs: 900, speedLineSpeed: 40, tiers: { street: 300, ace: 1000, legend: 2500 } },
  audio: { defaultVolume: 70 },
} as const;

export type CarKind = keyof typeof CONFIG.carLen;
