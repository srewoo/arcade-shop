// Arcade scoring maths for Dash mode (countdown + combo) and classic score helpers.
// All tuning numbers come from src/config/dash.ts.
import {
  CLASSIC_BASE_POINTS, CLASSIC_HINT_COST, CLASSIC_MISTAKE_COST, CLASSIC_MISTAKE_LIMIT, DASH, DIFFICULTY_MULTIPLIER,
} from '../config/dash';
import type { Difficulty } from './grader';

export { CLASSIC_MISTAKE_LIMIT, DASH, DIFFICULTY_MULTIPLIER };

export interface DashState {
  readonly timeLeftMs: number;
  readonly startMs: number;
  readonly combo: number;
  /** Game-clock time (ms, pauses excluded) of the last correct entry, or null. */
  readonly lastCorrectAt: number | null;
  readonly score: number;
}

export function dashStart(difficulty: Difficulty): DashState {
  const ms = DASH.startSeconds[difficulty] * 1000;
  return { timeLeftMs: ms, startMs: ms, combo: 0, lastCorrectAt: null, score: 0 };
}

export const dashTick = (s: DashState, dtMs: number): DashState => ({ ...s, timeLeftMs: Math.max(0, s.timeLeftMs - dtMs) });
export const isTimeUp = (s: DashState): boolean => s.timeLeftMs <= 0;

/** True when the clock should warn (red, pulsing). */
export const isLowTime = (s: DashState): boolean => s.timeLeftMs < Math.min(DASH.lowSeconds * 1000, s.startMs * DASH.lowFraction);

/** Share (0-1) of the combo window still open at game-clock `nowMs`. */
export function comboWindowLeft(s: DashState, nowMs: number): number {
  if (s.lastCorrectAt === null || s.combo < 1) return 0;
  return Math.max(0, Math.min(1, 1 - (nowMs - s.lastCorrectAt) / DASH.comboWindowMs));
}

/** Combo value after a correct entry at `nowMs`: it grows when the entry is quick, else restarts at 1. */
export function nextCombo(s: DashState, nowMs: number): number {
  const quick = s.lastCorrectAt !== null && nowMs - s.lastCorrectAt <= DASH.comboWindowMs;
  return quick ? Math.min(DASH.maxCombo, s.combo + 1) : 1;
}

export interface Award {
  readonly state: DashState;
  readonly points: number;
  readonly combo: number;
  readonly seconds: number;
}

export function dashCorrect(s: DashState, nowMs: number, difficulty: Difficulty): Award {
  const combo = nextCombo(s, nowMs);
  const points = Math.round(DASH.basePoints * DIFFICULTY_MULTIPLIER[difficulty] * combo);
  const gain = DASH.gainSeconds[difficulty];
  const cap = s.startMs * DASH.capFactor;
  const timeLeftMs = Math.min(cap, s.timeLeftMs + gain * 1000);
  return {
    state: { ...s, timeLeftMs, combo, lastCorrectAt: nowMs, score: s.score + points },
    points,
    combo,
    seconds: gain,
  };
}

export function dashMistake(s: DashState): DashState {
  return { ...s, timeLeftMs: Math.max(0, s.timeLeftMs - DASH.mistakePenaltySeconds * 1000), combo: 0, lastCorrectAt: null };
}

export const dashHint = (s: DashState): DashState => ({
  ...s,
  timeLeftMs: Math.max(0, s.timeLeftMs - DASH.hintPenaltySeconds * 1000),
  combo: 0,
  lastCorrectAt: null,
});

/** Bonus for finishing with time on the clock. Solver-assisted finishes earn none. */
export const dashFinishBonus = (s: DashState, assisted = false): number =>
  assisted ? 0 : Math.floor(s.timeLeftMs / 1000) * DASH.pointsPerSecondLeft;

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Elapsed classic time shows whole seconds (floor) so it counts up naturally. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** "+3s", "+3.5s": whole seconds without a decimal point. */
export const formatSeconds = (s: number): string => `${Number.isInteger(s) ? s : s.toFixed(1)}s`;

/** Classic-mode score: a base by difficulty, less time taken, mistakes and hints. Never negative. */
export function classicScore(difficulty: Difficulty, elapsedMs: number, mistakes: number, hints: number): number {
  const base = CLASSIC_BASE_POINTS * DIFFICULTY_MULTIPLIER[difficulty];
  return Math.max(0, Math.round(base - Math.floor(elapsedMs / 1000) - mistakes * CLASSIC_MISTAKE_COST - hints * CLASSIC_HINT_COST));
}
