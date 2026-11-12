// Pure helpers for round order and the status line (unit tested).
import { CONFIG } from './config';
import type { GameState, Player } from './game';
import type { Settings } from './settings';
import { S } from './strings';

/** Who starts round `round` (0-based). "alternate" starts with X, then swaps. */
export function roundStarter(first: Settings['first'], round: number): Player {
  if (first !== 'alternate') return first;
  return round % 2 === 0 ? 'X' : 'O';
}

export function statusText(s: GameState, opponent: Settings['opponent']): string {
  const vsCpu = opponent === 'cpu';
  if (s.winner) {
    if (!vsCpu) return S.playerWins(s.winner);
    return s.winner === 'X' ? S.youWin : S.cpuWins;
  }
  if (s.draw) return s.variant === 'vanishing' ? S.drawCap : S.draw;
  if (!vsCpu) return S.playerMove(s.turn);
  return s.turn === 'X' ? S.yourMove : S.cpuThinking;
}

/** Status shown once the round is over: the result plus the next step. */
export const gameOverText = (s: GameState, opponent: Settings['opponent']): string =>
  `${statusText(s, opponent)} ${S.playAgain}`;

/** "Move 12 / 60" for Vanishing, null elsewhere; `warn` flips on near the cap. */
export function moveCounter(s: GameState): { text: string; warn: boolean } | null {
  if (s.variant !== 'vanishing') return null;
  const { vanishMoveCap: cap, vanishWarnAt } = CONFIG.rules;
  const warn = s.moves >= vanishWarnAt;
  return { text: warn ? S.moveWarn(s.moves, cap) : S.moveCounter(s.moves, cap), warn };
}

export interface ResultBanner {
  readonly title: string;
  readonly sub: string;
  readonly tone: 'win' | 'lose' | 'draw';
}

/** Banner shown over the board once a round ends; null while it is running. */
export function resultBanner(s: GameState, opponent: Settings['opponent']): ResultBanner | null {
  if (!s.winner && !s.draw) return null;
  const title = statusText(s, opponent);
  if (s.draw) return { title, sub: s.variant === 'vanishing' ? S.resultSub.drawCap : S.resultSub.draw, tone: 'draw' };
  if (opponent === 'human') return { title, sub: S.resultSub.twoPlayer, tone: 'win' };
  return s.winner === 'X' ? { title, sub: S.resultSub.win, tone: 'win' } : { title, sub: S.resultSub.lose, tone: 'lose' };
}

/** Collapse Game options after the first finished round, on any screen. */
export const shouldOpenOptions = (roundsPlayed: number, shortSide: number): boolean =>
  roundsPlayed === 0 && shortSide >= 700;

/**
 * Auto-pause on blur only when the page really lost focus. Focus moving between
 * the page's own controls or into its own dialogs must not pause the game.
 */
export const shouldAutoPause = (inProgress: boolean, docHidden: boolean, docHasFocus: boolean): boolean =>
  inProgress && (docHidden || !docHasFocus);
