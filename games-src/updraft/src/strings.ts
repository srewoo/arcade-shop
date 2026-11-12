// User-facing strings for dynamic UI (static labels live in index.html).
import type { Mode } from './modes';

export const MODE_LABEL: Readonly<Record<Mode, string>> = {
  endless: 'Endless',
  daily: 'Daily',
  practice: 'Practice',
};

export const MODE_DESC: Readonly<Record<Mode, string>> = {
  endless: 'A fresh cave every run. How far can you go?',
  daily: 'One shared cave per day (same for everyone). One best per day.',
  practice: 'The same cave every time, with a ghost of your best run.',
};

/** Pick the keyboard or touch wording for the current pointer type. */
export const pick = (touch: boolean, keys: string, touchText: string): string => (touch ? touchText : keys);

export const S = {
  ready: 'Hold to launch',
  readyTouch: 'Touch and hold to launch',
  hint: 'Hold Space or click to rise. Let go to fall. Grab coins, dodge rock.',
  hintTouch: 'Touch and hold to rise. Let go to fall. Grab coins, dodge rock.',
  crashed: (m: number, coins: number, score: number): string =>
    `Crashed after ${m} metres with ${coins} ${coins === 1 ? 'coin' : 'coins'}. Score ${score}.`,
  newBest: 'New best!',
  best: (n: number): string => `Best ${n}`,
  ghostOn: 'Ghost of your best run is flying alongside.',
  ghostOff: 'No ghost yet: set a score to leave one.',
  dailyFor: (date: string): string => `Daily cave for ${date}`,
  paused: 'Paused',
  resumed: 'Resumed',
  confirmRestart: 'Abandon this run and start over?',
  confirmQuit: 'Abandon this run and go to the title?',
  muted: 'Sound muted',
  unmuted: 'Sound on',
  canvasLabel: 'Updraft cave. Hold space, click or touch to rise; release to fall.',
} as const;
