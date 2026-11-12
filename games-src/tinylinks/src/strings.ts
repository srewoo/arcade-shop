// User-facing strings for the game UI.
import type { CourseId } from './course';
import type { ScoreKind } from './game/scoring';

export const COURSE_LABEL: Readonly<Record<CourseId, string>> = { front9: 'Front 9', back9: 'Back 9', all18: 'Full 18' };
export const COURSE_DESC: Readonly<Record<CourseId, string>> = {
  front9: 'Nine friendly holes to find your touch.',
  back9: 'Nine tougher holes with gates, spinners and water.',
  all18: 'The whole round, eighteen holes.',
};

export const S = {
  title: 'Tiny Links',
  tagline: 'Top-down mini golf for one to four players.',
  canvasLabel: 'Mini golf course. Drag back and release to putt, or use the arrow keys and Space.',
  playersLegend: 'Players',
  courseLegend: 'Course',
  play: 'Tee off',
  best: (n: number): string => `Best solo round: ${n}`,
  noBest: 'No solo round yet',
  hole: (n: number): string => `Hole ${n}`,
  par: (n: number): string => `Par ${n}`,
  strokes: (n: number): string => `Strokes ${n}`,
  shoot: 'Putt',
  power: (p: number): string => `Power ${p}%`,
  hint: 'Drag back from anywhere and release to putt. Or use ← → to aim, ↑ ↓ for power and Space to putt.',
  hintTouch: 'Touch and drag back, then let go to putt. The further you pull, the harder the shot.',
  turn: (name: string, hole: number, par: number): string => `${name} to play, hole ${hole}, par ${par}.`,
  holed: (name: string, strokes: number, label: string): string => `${name} holed out in ${strokes}. ${label}`,
  splash: 'Splash. One stroke penalty. Back to your last spot.',
  scorecard: 'Scorecard',
  nextHole: 'Next hole',
  finish: 'See results',
  resultsTitle: 'Round complete',
  playAgain: 'Play again',
  changeSetup: 'Change setup',
  winner: (names: string, strokes: number): string => `${names} win${names.includes(' and ') ? '' : 's'} with ${strokes}.`,
  solo: (strokes: number, rel: string): string => `You finished with ${strokes} (${rel}).`,
  newBest: 'New best round!',
  paused: 'Paused',
  confirmRestart: 'Restart this round? Scores so far are lost.',
  confirmQuit: 'Quit to the title screen? This round will be lost.',
  muted: 'Sound muted',
  unmuted: 'Sound on',
} as const;

export const KIND_ARIA: Readonly<Record<ScoreKind, string>> = {
  ace: 'hole in one', albatross: 'albatross', eagle: 'eagle', birdie: 'birdie', par: 'par',
  bogey: 'bogey', double: 'double bogey', triple: 'triple bogey', over: 'over par', pickup: 'picked up',
};
