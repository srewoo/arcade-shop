// Audio mix and note tables. Synth-only; all levels are linear gain.
export const mix = {
  sfxBase: 0.65, // SFX bus at slider 100
  musicBase: 0.35, // music bus at slider 100 (the pad is much softer than SFX)
  padPeak: 0.14, // total pad envelope peak, split evenly across its oscillators
  dropletPeak: 0.12,
  compressor: { threshold: -18, ratio: 4, knee: 12, attack: 0.005, release: 0.2 },
  moveMinGapMs: 40,
  softDropMinGapMs: 70,
  denyMinGapMs: 140,
  fadeSeconds: 0.4,
} as const;

export const ambient = {
  root: 146.83, // D3
  pentatonic: [0, 2, 5, 7, 9],
  chordRoots: [0, -2, 3, -5, 5],
  padIntervals: [0, 7, 12, 16],
  padDetunes: [-6, 6],
  padCutoff: 700,
  delaySeconds: 0.62,
  feedback: 0.38,
  wet: 0.5,
} as const;

export const COMBO_BASE_HZ = 392;
export const A_PAD_ROOT_SEMI = 0;
