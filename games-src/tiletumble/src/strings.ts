// Every user-facing string lives here.
import type { ModeId } from './config';
import type { EndReason } from './game';

export const S = {
  title: 'Tile Tumble',
  tagline: 'Click touching discs of one colour to clear them. Bigger groups score far more.',
  modes: {
    classic: { name: 'Classic', blurb: 'Clear as much as you can. Wipe the board for a bonus.' },
    moves: { name: 'Move limit', blurb: 'Hit the target score before your moves run out.' },
    endless: { name: 'Endless', blurb: 'A new column rises every few moves. Do not let the board fill.' },
    daily: { name: 'Daily', blurb: 'One shared board per day. Beat your best.' },
  } satisfies Record<ModeId, { name: string; blurb: string }>,
  best: 'Best',
  score: 'Score',
  moves: 'Moves',
  movesLeft: 'Moves left',
  target: 'Target',
  discs: 'Discs',
  nextColumn: 'Rise in',
  undo: 'Undo',
  newGame: 'New game',
  menu: 'Menu',
  resume: 'Resume',
  restart: 'Restart',
  settings: 'Settings',
  quit: 'Quit to title',
  paused: 'Paused',
  pausedNote: 'The game is paused. Nothing moves until you resume.',
  confirmRestart: 'Abandon this game and start a new one?',
  confirmQuit: 'Leave this game and go back to the title?',
  yesRestart: 'Yes, restart',
  yesQuit: 'Yes, quit',
  keepPlaying: 'Keep playing',
  playAgain: 'Play again',
  backToTitle: 'Title',
  newBest: 'New best!',
  onboard: 'Click 2+ touching discs of one colour. Pairs score 0, so aim bigger: points = (size - 2) squared.',
  dismiss: 'Dismiss hint',
  hintKeys: 'Arrows and Enter play, Z undo, N new, P pause',
  previewIdle: 'Point at a disc to preview its group.',
  previewSingle: 'No group here. Need 2+ matching.',
  boardLabel: 'Tile Tumble board. Use arrow keys to move, Enter to clear a group.',
  noMoves: 'No moves left: no two touching discs match.',
  pairWarn: 'A pair scores 0 and uses a move. Look for 3 or more.',
  pause: 'Pause',
  settingsShort: 'Settings',
} as const;

export const preview = (n: number, points: number): string =>
  points > 0 ? `${n} discs, +${points} points` : `${n} discs, +0 (need 3+)`;

export const announceClear = (n: number, points: number, score: number): string =>
  `Cleared ${n} discs for ${points} points. Score ${score}.`;

export const endTitle = (reason: EndReason): string => {
  switch (reason) {
    case 'cleared': return 'Board cleared!';
    case 'target': return 'Target reached!';
    case 'short': return 'Out of moves';
    case 'overflow': return 'The board is full';
    default: return 'No moves left';
  }
};

export const endDetail = (reason: EndReason, score: number, bonus: number, left = 0): string => {
  const base = `Final score ${score}.`;
  if (reason === 'cleared') return `${base} Includes the ${bonus} point clear-board bonus.`;
  if (reason === 'stuck') return `${base} No two touching discs match any more, with ${left} ${left === 1 ? 'disc' : 'discs'} left on the board.`;
  return base;
};

export const dailyLabel = (key: string): string => `Daily ${key}`;
export const modeButtonLabel = (name: string, best: number): string => `${name}, best ${best}`;
