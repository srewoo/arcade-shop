// User-facing strings for dynamic UI (static labels live in index.html).
import type { Mode } from './modes';
import { CONFIG } from './config';

export const MODE_LABEL: Readonly<Record<Mode, string>> = { classic: 'Classic', twoballs: 'Two Balls', windy: 'Windy' };

export const MODE_DESC: Readonly<Record<Mode, string>> = {
  classic: 'One ball. Gravity creeps up the longer you rally.',
  twoballs: 'Two balls in the air at once. Drop either and it is over.',
  windy: 'Gusts push the ball sideways. Watch the windsock.',
};

export const pick = (touch: boolean, keys: string, touchText: string): string => (touch ? touchText : keys);

export const S = {
  ready: 'Click the ball to start',
  readyTouch: 'Tap the ball to start',
  readyKeys: 'Space to kick (arrows aim)',
  hint: 'Click low on the ball to kick it up. Off-centre hits send it sideways. No mouse? Arrows aim, Space kicks.',
  hintTouch: 'Tap the ball to knock it up. Off-centre taps send it sideways.',
  locked: (n: number): string => `Locked: reach ${n} in Classic`,
  unlockedNow: 'Two Balls unlocked!',
  newBest: 'New best!',
  best: (n: number): string => `Best ${n}`,
  over: (n: number, tier: string | null): string => `The ball hit the ground after ${n} ${n === 1 ? 'keepy' : 'keepies'}.${tier ? ` Rank ${tier}.` : ''}`,
  noRank: 'Unranked',
  paused: 'Paused',
  muted: 'Sound muted',
  unmuted: 'Sound on',
  confirmRestart: 'Abandon this rally and start over?',
  confirmQuit: 'Abandon this rally and go to the title?',
  gust: 'Gust incoming',
  calm: 'Calm',
  windDir: (f: number): string => `${f < 0 ? 'West' : 'East'} ${Math.abs(Math.round(f / 60))}`,
  tierSay: (label: string, n: number): string => `${label} ${n}`,
  canvasLabel: 'Keepy Up court. Click or tap the ball to knock it up, or use arrow keys to aim and Space to kick.',
  unlockHint: CONFIG.twoBalls.unlockScore,
} as const;
