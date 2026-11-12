// Every gameplay and feel tuning number lives here (single place).
export const CONFIG = {
  field: {
    w: 600, h: 720, cols: 12, brickW: 50, brickH: 22, top: 80, maxRows: 14,
    // Logical field limits used by the responsive fit (layout.ts). Brick grid is always 600 wide.
    maxW: 760, minH: 520, maxH: 1200, clearance: 170, paddleBottom: 52,
  },
  sim: { step: 1 / 120, maxFrame: 0.1, maxStepsPerFrame: 12 },
  paddle: { w: 96, h: 14, y: 668, keySpeed: 760, followSpeed: 2800, wideMul: 1.6, resizeSpeed: 360 },
  ball: {
    r: 8,
    baseSpeed: 340,
    perLevel: 6,
    maxSpeed: 520,
    maxAngleDeg: 60,
    minVyRatio: 0.3,
    slowMul: 0.65,
    maxBalls: 8,
    launchJitter: 0.25,
    trail: 6,
  },
  power: {
    dropChance: 0.1,
    fallSpeed: 150,
    capsuleW: 40,
    capsuleH: 20,
    wideSec: 14,
    slowSec: 10,
    laserSec: 10,
    laserCooldown: 0.32,
    boltSpeed: 820,
    splitRad: 0.35,
  },
  lives: { start: 3, max: 6, extraEvery: 5000 },
  score: { hit: 5, breakPerHp: 10, comboStep: 5, comboMaxMul: 4, catchBonus: 50, clearBase: 200, clearPerLife: 100 },
  endless: { speedPerLevel: 8, maxRows: 9 },
  fx: {
    particles: 14, reducedFactor: 0.4, shakeMs: 260, shakePx: 6, particleSec: 0.65, confetti: 90,
    popupSec: 0.8, squashSec: 0.16, bannerSec: 1.3, flashSec: 0.35, hitFlashSec: 0.12,
    payoffMs: 1100, payoffReducedMs: 250,
  },
  audio: { defaultVolume: 70, masterGain: 0.5 },
  bot: { aimSwing: 0.7, aimRate: 1.7 },
} as const;

export const LEVEL_COLS = CONFIG.field.cols;
