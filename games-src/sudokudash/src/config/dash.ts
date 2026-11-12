// Dash / Classic tuning. Every gameplay number lives here (see tests/balance.test.ts for the
// Monte-Carlo check that these values give a fair loss rate at the reference pace).
import type { Difficulty } from '../core/grader';

type PerLevel<T> = Readonly<Record<Difficulty, T>>;

export const DASH = {
  /** Starting countdown in seconds. */
  startSeconds: { easy: 220, medium: 265, hard: 280, expert: 285 } as PerLevel<number>,
  /** Seconds a correct digit buys. Harder grids pay more per digit because each digit takes longer. */
  gainSeconds: { easy: 3, medium: 3.5, hard: 4, expert: 4.5 } as PerLevel<number>,
  mistakePenaltySeconds: 10,
  hintPenaltySeconds: 8,
  /** A correct entry within this window of the previous one extends the combo. */
  comboWindowMs: 6000,
  maxCombo: 8,
  basePoints: 50,
  pointsPerSecondLeft: 10,
  /** The countdown never grows past this multiple of the starting time. */
  capFactor: 1.25,
  /** The clock turns red (and pulses) below min(lowSeconds, lowFraction * start). */
  lowSeconds: 30,
  lowFraction: 0.2,
  /** A tick sound plays once per second for this many final seconds. */
  tickSeconds: 10,
} as const;

export const DIFFICULTY_MULTIPLIER: PerLevel<number> = { easy: 1, medium: 1.5, hard: 2, expert: 3 };

export const CLASSIC_MISTAKE_LIMIT = 3;
export const CLASSIC_BASE_POINTS = 2000;
export const CLASSIC_MISTAKE_COST = 100;
export const CLASSIC_HINT_COST = 50;

/** Balance targets used by the simulation test and the title-screen "par" hint. */
export const BALANCE = {
  /** Seconds per blank cell for a typical player at each level. */
  referencePace: { easy: 7, medium: 7.5, hard: 8, expert: 8.5 } as PerLevel<number>,
  /** Typical number of blank cells per generated puzzle (sampled: 45 / 53 / 55 / 56). */
  typicalBlanks: { easy: 45, medium: 53, hard: 55, expert: 56 } as PerLevel<number>,
  /** Share of entries that are wrong for the reference player. */
  referenceMistakeRate: 0.03,
  /** Loss rate band the reference player should land in. */
  targetLossRate: { min: 0.1, max: 0.3 },
} as const;
