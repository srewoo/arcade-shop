// Win-card copy and star states. Pure: the wording must never contradict the award.
import { CONFIG } from '../config';
import { S } from '../strings';
import { rate } from './stars';
import type { Level } from './types';

export type StarState = 'earned' | 'capped' | 'empty';

export interface WinCopy {
  readonly stars: readonly StarState[];
  readonly lines: readonly { readonly text: string; readonly tone: 'good' | 'note' | 'plain' }[];
}

/** Stars the run would have earned with no hints (what a hint cap withholds). */
export const uncappedStars = (level: Level, cost: number): number => rate(level, cost, 0);

export function starStates(awarded: number, uncapped: number): StarState[] {
  return Array.from({ length: CONFIG.rating.maxStars }, (_, i) => (i < awarded ? 'earned' : i < uncapped ? 'capped' : 'empty'));
}

export function winCopy(level: Level, cost: number, moves: number, hinted: boolean): WinCopy {
  const awarded = rate(level, cost, hinted ? 1 : 0);
  const uncapped = uncappedStars(level, cost);
  const total = level.pack === 'bridge' ? S.result.wonBridge(cost, level.par) : S.result.wonRaft(moves, level.par);
  const atPar = cost <= level.par;
  const lines: { text: string; tone: 'good' | 'note' | 'plain' }[] = [{ text: total, tone: 'plain' }];
  if (atPar && !hinted) lines.push({ text: S.result.perfect, tone: 'good' });
  else if (atPar && hinted) lines.push({ text: S.result.bestWithHint, tone: 'note' });
  else if (hinted && uncapped > awarded) lines.push({ text: S.result.hintNote, tone: 'note' });
  return { stars: starStates(awarded, uncapped), lines };
}
