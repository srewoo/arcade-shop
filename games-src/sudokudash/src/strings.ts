// User-facing strings for the polish-pass UI (no i18n framework, one place to edit copy).
import { DASH, CLASSIC_MISTAKE_LIMIT } from './config/dash';
import { formatClock, formatSeconds } from './core/scoring';
import type { PauseReason } from './sessionTypes';

export const STR = {
  modeDashSub: 'Race the clock, build combos',
  modeClassicSub: 'No countdown, optional 3-strike limit',
  limitLabel: `${CLASSIC_MISTAKE_LIMIT}-mistake limit in Classic`,
  coach: 'Tap a cell, then a number. Wrong numbers show red.',
  soundOn: 'Sound on (M)',
  soundOff: 'Sound off (M)',
  pauseTop: 'Pause (P)',
  resumeTop: 'Resume (P)',
  hintClassic: 'Hint (H)',
  coachNotes: 'Tip: Notes (N) pencils in candidates. Hint (H) explains the next step.',
  savedExpired: 'Saved game expired or could not be read.',
  confirmSolveAll: 'Solve all? Tap again',
  solveAll: 'Solve all',
  solveStep: 'Solve step',
  solverOpen: 'Solver',
  copyResult: 'Copy result',
  copied: 'Copied to clipboard.',
  copyFailed: 'Could not copy. Select the text below and copy it.',
  readyTitle: 'Ready?',
  pausedTitle: 'Paused',
  resumeFromReady: 'Start',
  confirmRestart: 'Restart this puzzle from the beginning?',
  confirmQuit: 'Quit to the title? Your run is saved and you can continue it.',
  dailyDone: 'Done today',
  settingsTitle: 'Settings',
  pausedReason: {
    manual: 'Paused', menu: 'Paused', settings: 'Paused (settings open)', hidden: 'Paused (tab hidden)',
    blur: 'Paused (window lost focus)', ready: 'Ready?',
  } satisfies Record<PauseReason, string>,
  announce: {
    wrongDash: (s: number): string => `Wrong digit, minus ${s} seconds`,
    wrong: 'Wrong digit',
    combo: (n: number): string => `Combo times ${n}`,
    lowTime: (s: number): string => `${s} seconds left`,
    paused: 'Paused',
    resumed: 'Resumed',
    house: 'Section complete',
  },
  strike: (n: number, max: number): string => `Mistake ${n} of ${max}`,
} as const;

/** Hint button caption: in Dash a hint costs clock time, so say so before it is pressed. */
export function hintLabel(dash: boolean): string {
  return dash ? `Hint (-${DASH.hintPenaltySeconds}s)` : STR.hintClassic;
}

/** The "How Dash works" copy, generated from the live config so it can never drift. */
export function dashRulesLines(): readonly string[] {
  const g = DASH.gainSeconds;
  return [
    `The clock starts at ${formatClock(DASH.startSeconds.easy * 1000)} on Easy and runs down while you play. Reach zero and the run ends.`,
    `Each correct digit adds ${formatSeconds(g.easy)} on Easy (${formatSeconds(g.expert)} on Expert). The clock can never exceed ${DASH.capFactor}x its starting time.`,
    `A wrong digit costs ${DASH.mistakePenaltySeconds}s and breaks your combo. A hint costs ${DASH.hintPenaltySeconds}s.`,
    `Correct digits within ${DASH.comboWindowMs / 1000}s of each other build a combo (up to x${DASH.maxCombo}) that multiplies the ${DASH.basePoints}-point base.`,
    `Finish with time left for ${DASH.pointsPerSecondLeft} points per second. Using Solve step or Solve all removes that bonus.`,
    `Each cell pays only once, so undoing and re-entering a digit earns nothing.`,
  ];
}
