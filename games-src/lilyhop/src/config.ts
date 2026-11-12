// Every gameplay and feel tuning number lives here.
export const CONFIG = {
  keys: {
    settings: 'lilyhop-settings',
    progress: 'lilyhop-progress',
    onboarded: 'lilyhop-onboarded',
  },
  stars: {
    /** Two stars when moves <= ceil(optimal * factor). */
    twoStarFactor: 1.3,
    /** Using a hint caps the result at this many stars. */
    hintCap: 2,
  },
  solver: {
    /** Safety valve for the state graph (largest shipped level is far below this). */
    maxStates: 400_000,
  },
  daily: {
    minDistance: 6,
    sizes: [3, 4] as readonly number[],
    gaps: [1, 2] as readonly number[],
  },
  timing: {
    hopMs: 240,
    jumpMs: 360,
    shakeMs: 320,
    toastMs: 2400,
    winDelayMs: 1300,
    winDelayReducedMs: 500,
    hintMs: 2600,
    hintPieceMs: 4500,
  },
  fx: { confetti: 40, fireflies: 12, ripples: 7, particleScaleReduced: 0.4 },
  layout: { minCell: 44, comfortCell: 56, fillCell: 96, maxCell: 168, inset: 20 },
  audio: { defaultVolume: 70, masterGain: 0.5 },
  ambientSeed: 20261111,
} as const;
