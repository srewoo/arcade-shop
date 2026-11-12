// Single home for gameplay tuning. Frozen at load; tests import the same
// object. CSS timings are exported to custom properties by ui/appearance.ts.
export const CONFIG = Object.freeze({
  scoring: {
    /** Two stars when moves <= par + max(minSlack, ceil(par * slackRatio)). */
    twoStarSlackRatio: 0.5,
    twoStarMinSlack: 2,
    /** Using any hint caps the result at this many stars. */
    hintStarCap: 2,
  },
  progress: {
    /** How many levels beyond the first unfinished one can be opened. */
    unlockAhead: 3,
    /** Locked levels listed beyond the last playable one (the rest are teased). */
    peekAhead: 4,
  },
  quick: {
    attempts: 600,
    seedMax: 999_999,
    tiers: [
      { id: 'easy', jugs: [2, 3], capMax: 9, parMin: 3, parMax: 6, split: false },
      { id: 'medium', jugs: [3, 3], capMax: 14, parMin: 6, parMax: 9, split: true },
      { id: 'hard', jugs: [4, 4], capMax: 19, parMin: 8, parMax: 13, split: true },
    ],
  },
  audio: { masterGain: 0.5, defaultVolume: 70 },
  fx: {
    winDelayMs: 1700,
    winDelayReducedMs: 250,
    gateMs: 1000,
    pourMs: 420,
    sparkCount: 22,
  },
  timer: { tickMs: 250 },
  ui: { toastMs: 2200, hintFlashMs: 2400 },
} as const);

export type QuickTier = (typeof CONFIG.quick.tiers)[number];
