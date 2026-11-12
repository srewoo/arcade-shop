// All gameplay and feel tuning lives here (one place, no magic numbers elsewhere).
export const CONFIG = {
  bridge: {
    capacity: 2,
    /** Daily generator: traveller count range and slack (spare minutes over par). */
    daily: { minTravellers: 4, maxTravellers: 6, minTime: 1, maxTime: 14, minSlack: 0, maxSlack: 2 },
  },
  rating: {
    /** Raft pack: 3 stars at par, 2 stars within this many crossings of par. */
    raftTwoStarSlack: 2,
    /** Using a hint caps the result at this many stars. */
    hintStarCap: 2,
    maxStars: 3,
  },
  fx: {
    moveMs: 380,
    /** Win payoff (confetti, lamp glow, hop) plays this long before the result card opens. */
    winDelayMs: 1500,
    reducedWinDelayMs: 450,
    shakeMs: 360,
    confettiCount: 56,
    confettiMs: 1800,
    reducedParticleShare: 0.4,
  },
  audio: { defaultVolume: 70, masterGain: 0.5 },
  ui: {
    toastMs: 3200,
    dailyKeep: 30,
    /** Figure colours (hex so the contrast test can read them). Light enough for the dark scene. */
    figurePalette: ['#ff9d8a', '#ffd166', '#8fe3a1', '#7fd3f7', '#c8a8ff', '#ff8fc6', '#f5b87a', '#a6e4d8'],
  },
} as const;

export const STORAGE_KEYS = {
  settings: 'lb-settings',
  progress: 'lb-progress',
  onboardBridge: 'lb-onboard-bridge',
  onboardRaft: 'lb-onboard-raft',
} as const;
