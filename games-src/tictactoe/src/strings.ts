// User-facing text lives here (no i18n framework, just one place to edit).
import type { Settings } from './settings';

export const S = {
  title: 'Tic·Tac·Toe',
  yourMove: 'Your move',
  cpuThinking: 'CPU is thinking…',
  cpuStarts: 'CPU starts this round',
  youWin: 'You win!',
  cpuWins: 'CPU wins this one.',
  playerWins: (p: string) => `Player ${p} wins!`,
  playerMove: (p: string) => `Player ${p} to move`,
  draw: "It's a draw.",
  drawCap: 'Draw: move limit reached.',
  playAgain: 'Press N for another round',
  paused: 'Paused',
  pausedAuto: 'Paused while the page was in the background.',
  pausedNote: 'The CPU waits while the game is paused.',
  onboarding: 'Get 3 in a row to win. Tap any square.',
  onboardingTwo: 'Get 3 in a row. X goes first.',
  dismiss: 'Dismiss hint',
  moveCounter: (n: number, cap: number) => `Move ${n} / ${cap}`,
  moveWarn: (n: number, cap: number) => `Move ${n} / ${cap}: a draw is called at ${cap}`,
  streak: (now: number, best: number) => `Streak ${now} · Best ${best}`,
  streakMilestone: (n: number) => `${n} wins in a row!`,
  newRoundConfirm: 'Abandon this round? Press again',
  newRoundStatus: 'Round in progress. Press N again to abandon it.',
  resetScores: 'Reset scores',
  resetConfirm: 'Tap again to confirm',
  restartPrompt: 'Start a new round with this setting?',
  restartYes: 'Restart',
  restartNo: 'Cancel',
  pauseRestartPrompt: 'Abandon this round and start a new one?',
  nextOut: 'next out',
  resultNext: 'Next round',
  resultView: 'View board',
  resultSub: {
    win: 'Three in a row.',
    lose: 'The CPU got three in a row.',
    draw: 'Nobody got three in a row.',
    drawCap: 'The move limit was reached.',
    twoPlayer: 'Three in a row.',
  },
  willDisappear: ', will disappear next',
  willDisappearLater: ', will disappear on its owner’s next move',
  cellLabel: (row: number, col: number, what: string) => `Row ${row}, column ${col}: ${what}`,
  empty: 'empty',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  themeLabel: (t: string) => `Theme: ${t}`,
  levelDesc: {
    easy: 'Easy: plays random moves.',
    medium: 'Medium: always wins or blocks, otherwise half random.',
    strong: 'Hard: wins, blocks, and rarely slips (about 1 move in 7).',
    hard: 'Expert: never loses Classic, so a draw is your best result.',
    hardVanishing: 'Expert: searches 8 moves ahead, but can still be beaten in Vanishing.',
  },
  levelNames: { easy: 'Easy', medium: 'Medium', strong: 'Hard', hard: 'Expert', hardVanishing: 'Expert' },
  opponentNames: { cpu: 'vs CPU', human: '2 Players' },
  variantNames: { classic: 'Classic', vanishing: 'Vanishing' },
} as const;

export type LevelKey = Settings['level'];

export function levelName(level: LevelKey, variant: Settings['variant']): string {
  if (level === 'hard' && variant === 'vanishing') return S.levelNames.hardVanishing;
  return S.levelNames[level];
}

export function levelDescription(level: LevelKey, variant: Settings['variant']): string {
  if (level === 'hard' && variant === 'vanishing') return S.levelDesc.hardVanishing;
  return S.levelDesc[level];
}

/** One-line summary shown on the collapsed "Game options" disclosure. */
export function optionsSummary(s: Settings): string {
  const parts: string[] = [S.opponentNames[s.opponent]];
  if (s.opponent === 'cpu') parts.push(levelName(s.level, s.variant));
  parts.push(S.variantNames[s.variant]);
  return parts.join(' · ');
}
