// All gameplay and feel tuning lives here. Nothing else hard-codes these numbers.
export const CONFIG = {
  board: { cols: 8, rows: 9 },
  scoring: { clearBonus: 250 },
  modes: {
    classic: { colours: 4 },
    moves: { colours: 4, moveLimit: 12, targetShare: 0.45 },
    endless: { colours: 4, startCols: 5, startRows: 5, risePeriod: 3, riseMin: 3, riseMax: 6 },
    daily: { colours: 5 },
  },
  solver: { beam: 10, potentialWeight: 0.5 },
  validation: { maxLeftoverShare: 0.25, minPerColour: 6, maxAttempts: 40 },
  stats: { dailyKeep: 30 },
  fx: {
    gravity: 70,
    slideRate: 14,
    riseRate: 9,
    popMs: 180,
    floatMs: 700,
    particlesPerDisc: 7,
    particleCap: 140,
    ringMs: 380,
    ringCap: 24,
    sweepMs: 1100,
    reducedParticleShare: 0,
    hoverScale: 1.07,
  },
  audio: { defaultVolume: 70, masterGain: 0.5 },
  ui: { onboardKey: 'tt-onboarded', hintMs: 9000 },
} as const;

export type ModeId = 'classic' | 'moves' | 'endless' | 'daily';
export const MODE_IDS: readonly ModeId[] = ['classic', 'moves', 'endless', 'daily'];
