// Gameplay tuning: the one place for gravity, lock, scoring, Zen and touch numbers.
// Pure data, no DOM. `classic` reproduces the original numbers exactly (replay and
// scoring tests pin them); `tuned` is the Stackfall-own curve and score ladder.
export const TICKS_PER_SECOND = 60;
export const MAX_LEVEL = 15;

export type TuningId = 'classic' | 'tuned';
export const TUNING_IDS: readonly TuningId[] = ['classic', 'tuned'];

export interface ScoreTables {
  readonly line: readonly number[];
  readonly twist: readonly number[];
  readonly mini: readonly number[];
  readonly allClear: readonly number[];
  readonly b2bPercent: number; // bonus on top of a difficult clear
  readonly comboStep: number; // points per combo step per level
}

export interface Tuning {
  readonly id: TuningId;
  readonly label: string;
  readonly baseFramesPerRow: number; // level 1
  readonly gravityFactor: number; // multiplier per level
  readonly maxLevel: number;
  readonly instantFromLevel: number | null; // gravity tier of 20 rows/frame
  readonly softDropFloor: number; // rows per frame, never slower than this
  readonly softDropMultiplier: number | null; // soft drop = base * multiplier when larger
  readonly sprintLinesPerLevel: number | null; // Sprint ramps instead of a fixed level
  readonly scores: ScoreTables;
}

const CLASSIC_SCORES: ScoreTables = {
  line: [0, 100, 300, 500, 800],
  twist: [400, 800, 1200, 1600],
  mini: [100, 200, 400, 400],
  allClear: [0, 800, 1200, 1800, 2000],
  b2bPercent: 50,
  comboStep: 50,
};

const TUNED_SCORES: ScoreTables = {
  line: [0, 100, 250, 450, 750],
  twist: [350, 700, 1100, 1500],
  mini: [100, 200, 350, 350],
  allClear: [0, 700, 1100, 1600, 1900],
  b2bPercent: 40,
  comboStep: 40,
};

export const TUNINGS: Readonly<Record<TuningId, Tuning>> = Object.freeze({
  classic: {
    id: 'classic', label: 'Classic', baseFramesPerRow: 48, gravityFactor: 0.82, maxLevel: MAX_LEVEL,
    instantFromLevel: null, softDropFloor: 1 / 3, softDropMultiplier: null, sprintLinesPerLevel: null, scores: CLASSIC_SCORES,
  },
  tuned: {
    id: 'tuned', label: 'Tuned', baseFramesPerRow: 36, gravityFactor: 0.8, maxLevel: 20,
    instantFromLevel: 16, softDropFloor: 1 / 3, softDropMultiplier: 6, sprintLinesPerLevel: 8, scores: TUNED_SCORES,
  },
});

export const lockTuning = { lockDelay: 30, moveResetLimit: 15 } as const;
export const zenTuning = { garbageIntervalTicks: 10 * TICKS_PER_SECOND } as const;
export const dropPoints = { softPerRow: 1, hardPerRow: 2 } as const;
export const INSTANT_ROWS_PER_FRAME = 20;
export const LINES_PER_LEVEL = 10;

/** Frames the piece needs to fall one row at this level. */
export function framesPerRow(level: number, t: Tuning = TUNINGS.classic): number {
  if (t.instantFromLevel !== null && level >= t.instantFromLevel) return 1 / INSTANT_ROWS_PER_FRAME;
  return Math.max(1, t.baseFramesPerRow * Math.pow(t.gravityFactor, level - 1));
}

/** Rows per frame while soft dropping at this level. */
export function softDropRate(level: number, t: Tuning = TUNINGS.classic): number {
  const base = 1 / framesPerRow(level, t);
  const boosted = t.softDropMultiplier === null ? 0 : base * t.softDropMultiplier;
  return Math.max(base, t.softDropFloor, boosted);
}

export const touchTuning = {
  tapMovePx: 12, // a touch that moves less than this is a tap
  tapMaxMs: 350,
  hardDropPx: 50,
  hardDropMaxMs: 600,
  minStepPx: 14,
  maxStepPx: 30,
  stepCellFactor: 0.85,
  softDropSteps: 1.2,
} as const;
