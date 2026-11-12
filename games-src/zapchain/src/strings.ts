// User-facing strings for dynamic UI (static labels live in index.html).
import type { OverReason } from './model/types';

/** Pick the keyboard or touch wording for the current pointer type. */
export const pick = (touch: boolean, keys: string, touchText: string): string => (touch ? touchText : keys);

export const OVER_TITLE: Readonly<Record<OverReason, string>> = { time: "TIME'S UP!", full: 'GAME OVER!' };
export const OVER_DETAIL: Readonly<Record<OverReason, string>> = {
  time: 'The clock ran out before you zapped enough discs.',
  full: 'A column of discs reached the feeder.',
};

/** Tier label for a zap, by how many discs it took. */
export function chainLabel(n: number): string {
  if (n >= 20) return 'OVERLOAD!';
  if (n >= 12) return 'MEGA CHAIN!';
  if (n >= 7) return 'SHOCK!';
  if (n >= 4) return 'NICE!';
  return '';
}

export const formatTime = (sec: number): string => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const S = {
  ready: (level: number, target: number): string => `Level ${level} · zap ${target} discs`,
  hint: 'Click a group of 2 or more matching discs to zap it. Bigger groups score far more. A bomb clears its whole row.',
  hintTouch: 'Tap a group of 2 or more matching discs to zap it. Bigger groups score far more. A bomb clears its whole row.',
  hintKeys: 'Arrow keys move the cursor, Enter or Space zaps.',
  paused: 'Paused',
  resumed: 'Resumed',
  confirmRestart: 'Abandon this run and start over?',
  confirmQuit: 'Abandon this run and go to the title?',
  muted: 'Sound muted',
  unmuted: 'Sound on',
  newBest: 'New best!',
  best: (n: number): string => `Best ${n.toLocaleString('en-US')}`,
  canvasLabel: 'Zap Chain board: a 10 by 11 grid of coloured discs. Click or tap a group of matching discs, or use the arrow keys and Enter, to zap it.',
  zapped: (n: number, pts: number): string => `Zapped ${n} discs for ${pts} points`,
  bombed: (n: number): string => `Bomb cleared ${n} discs`,
  levelCleared: (level: number, bonus: number): string => `Level ${level} cleared. Time bonus ${bonus}.`,
  gameOver: (reason: OverReason, score: number, level: number): string => `${OVER_TITLE[reason]} Score ${score} on level ${level}.`,
  levelLabel: (level: number): string => `Level ${level}`,
  symbolNames: ['triangle', 'square', 'diamond', 'ring', 'star'] as readonly string[],
} as const;
