// User-facing strings for dynamic UI (static labels live in index.html).
import type { PowerKind } from './sim/types';

export const POWER_LABEL: Readonly<Record<PowerKind, string>> = {
  double: 'Twin line',
  sticky: 'Sticky line',
  slow: 'Slow tide',
  shield: 'Bubble shield',
};

export const S = {
  ready: 'Move or press Space to begin',
  readyTouch: 'Tap a button to begin',
  hint: 'Arrows or A/D to walk, Space to fire your line. Pop a bubble to split it; the smallest ones pop.',
  hintTouch: 'Use the arrow buttons to walk and the big button to fire. Pop a bubble to split it.',
  stageLine: (n: number, name: string): string => `Stage ${n}: ${name}`,
  cleared: (bonus: number): string => `Stage clear! Time bonus ${bonus}.`,
  lostHit: 'Popped! A bubble got you.',
  lostTime: "Time's up!",
  extraLife: 'Extra life!',
  gameOver: (score: number, stage: number): string => `Game over. Score ${score}, reached stage ${stage}.`,
  newBest: 'New best!',
  best: (n: number): string => `Best ${n}`,
  stageBest: (n: number): string => (n > 0 ? `Furthest stage ${n}` : ''),
  paused: 'Paused',
  resumed: 'Resumed',
  confirmRestart: 'Abandon this run and start over?',
  confirmQuit: 'Abandon this run and go to the title?',
  muted: 'Sound muted',
  unmuted: 'Sound on',
  collected: (k: PowerKind): string => `${POWER_LABEL[k]} collected`,
  canvasLabel: 'Split Shot playfield. Walk with the arrow keys or A and D, fire with Space.',
} as const;

/** Pick the keyboard or touch wording for the current pointer type. */
export const pick = (touch: boolean, keys: string, touchText: string): string => (touch ? touchText : keys);
