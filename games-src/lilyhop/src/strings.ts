// User-facing text lives here (no i18n framework, just one place to edit).
import type { Group } from './levels';
import { resultKind, type ResultKind } from './scoring';

/** Result copy. Never says "perfect" or "best possible" for a run whose third star a hint withheld. */
function resultNote(moves: number, optimal: number, hints: number): string {
  switch (resultKind(moves, optimal, hints)) {
    case 'perfect': return `${moves} moves: the best possible, with no hints.`;
    case 'hintCapped':
      return `${moves} moves matches the best possible (${optimal}), but ${hints === 1 ? 'the hint you used caps' : 'the hints you used cap'} the result at 2 stars. Replay with no hints for 3.`;
    case 'close': return `${moves} moves. The best possible is ${optimal}.`;
    default: return `${moves} moves. The best possible is ${optimal}, so there is room to improve.`;
  }
}

export const S = {
  title: 'Lily Hop',
  play: 'Play',
  playContinue: 'Continue',
  daily: 'Daily Hop',
  dailyName: (date: string) => `Daily Hop ${date}`,
  groups: { classic: 'Classic crossing', gaps: 'Two gaps', grid: 'Grid ponds' } satisfies Record<Group, string>,
  // Non-breaking spaces keep "2 + 2" on one line in the header.
  levelName: (group: string, label: string) => `${group}: ${label.replace(/ /g, '\u00a0')}`,
  locked: (prev: string) => `Locked. Finish ${prev} first.`,
  lockedShort: 'Locked',
  starsOf: (n: number) => `${n} of 3 stars`,
  noStars: 'Not finished',
  onboarding: 'Tap a frog to hop. Pieces only move forward: one step into an empty pad, or a jump over one rival. Swap the teams.',
  howto: [
    'Green frogs start on one side, amber toads on the other. Swap them.',
    'Frogs hop right (and down on grid ponds). Toads hop left (and up).',
    'A piece may step into an empty pad next to it, or jump over one rival into the empty pad behind.',
    'Nobody hops backwards. If no move can finish the swap you are stuck: Undo or Restart.',
    'Stars: 3 for the best possible number of moves with no hints, 2 for a close finish, 1 for any finish. Using a hint caps you at 2.',
    'Keys: arrows move between pads, Enter or Space hops, U undo, H hint, R restart, P or Esc pause, M mute.',
  ],
  ready: 'Pick a frog to start.',
  selected: 'Frog selected. Pick a pad to hop to, or tap it again to cancel.',
  playing: (moves: number) => `${moves} ${moves === 1 ? 'move' : 'moves'} so far`,
  blocked: 'That piece has no move right now.',
  noPiece: 'Tap a frog or toad that can hop.',
  ambiguous: 'More than one piece can reach that pad. Tap the one you want to move.',
  stuck: 'Stuck: the teams can no longer swap from here. Undo a few hops or restart.',
  stuckSr: 'Stuck. Press U to undo.',
  starRule: (three: number, two: number) => `3 stars: ${three} moves, no hints. 2 stars: up to ${two} moves.`,
  starRuleHinted: (two: number) => `Hint used: 2 stars at most. Finish in ${two} moves or fewer to keep them.`,
  hintCost: 'Using a hint caps the result at 2 stars',
  win: (moves: number, optimal: number, hints: number) => resultNote(moves, optimal, hints),
  resultTitle: { perfect: 'Perfect crossing!', hintCapped: 'Pond crossed!', close: 'Nicely hopped!', done: 'Pond crossed!' } satisfies Record<ResultKind, string>,
  hintPiece: 'Hint: this glowing piece should move next. Press Hint again to see where.',
  hintShown: 'Hint: the glowing piece hops to the glowing pad.',
  noHint: 'No hint available.',
  undone: 'Undid the last hop.',
  nothingToUndo: 'Nothing to undo yet.',
  paused: 'Paused',
  pausedAuto: 'Paused while the page was in the background.',
  pausedNote: 'The timer waits while the game is paused.',
  restartConfirm: 'Restart this level? Your hops so far will be lost.',
  quitConfirm: 'Quit to the title? Your hops on this level will be lost.',
  confirmRestartYes: 'Yes, restart',
  confirmQuitYes: 'Yes, quit',
  keepPlaying: 'Keep playing',
  nextLevel: 'Next level',
  playAgain: 'Play again',
  newBest: 'New best!',
  bestLine: (moves: number, ms: string) => `Your best: ${moves} moves, ${ms}`,
  resultLine: (time: string, undos: number, hints: number) => `Time ${time}. Undos ${undos}, hints ${hints}.`,
  resultNote,
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  padLabel: (n: number, total: number, what: string) => `Pad ${n} of ${total}: ${what}`,
  frogWord: 'frog',
  toadWord: 'toad',
  emptyPad: 'empty',
  canHop: 'can hop',
  blockedWord: 'blocked',
  lessonJump: 'Jump!',
  heroLabel: 'Frogs and toads on lily pads, ready to swap sides',
  celebrate: 'Pond crossed!',
} as const;
