// All user-facing copy lives here (no i18n framework).
import type { RoundOutcome } from './events';
import type { Rating } from './rounds';

export const S = {
  title: 'Clay Day',
  tagline: 'Twenty-five clays. Two shells. One breezy afternoon.',
  start: 'Start',
  settings: 'Settings',
  howTo: 'How to play',
  pause: 'Pause',
  resume: 'Resume',
  restart: 'Restart round',
  quit: 'Quit to title',
  done: 'Done',
  mode: 'Mode',
  campaign: 'Campaign',
  practice: 'Practice',
  practiceRound: 'Practice round',
  modeDesc: {
    campaign: 'Clear each round with enough hits to move on. Wind and speed build up. A failed round ends the run.',
    practice: 'No clock, no wind, no pressure. Pick the round pace to rehearse. Scores are not saved.',
  },
  hint: 'Click or tap to fire. Two shells, then reload (R). Aim ahead of the clay.',
  hintClose: 'Dismiss hint',
  keys: 'Arrows aim · Space fire · R reload · P pause · M mute',
  volume: 'Volume',
  sound: 'Sound',
  on: 'On',
  off: 'Off',
  muted: 'Muted',
  system: 'System',
  reduceMotion: 'Reduce motion',
  colorAssist: 'Colour-blind assist',
  textSize: 'Text size',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  paused: 'Paused',
  pausedNote: 'The clock is stopped.',
  confirmRestart: 'Abandon this round and start it again?',
  confirmQuit: 'Quit this run and go back to the title?',
  yes: 'Yes',
  keepPlaying: 'Keep playing',
  round: 'Round',
  score: 'Score',
  time: 'Time',
  wind: 'Wind',
  calm: 'Calm',
  shells: 'Shells',
  reload: 'Reload',
  reloading: 'Reloading',
  left: 'left',
  combo: 'Combo',
  ready: 'Ready…',
  pull: 'Pull!',
  doubleCall: 'Double!',
  hitWord: 'hit',
  nextRound: 'Next round',
  tryAgain: 'Try again',
  again: 'Another round',
  toTitle: 'Title screen',
  passed: 'Round cleared',
  failed: 'Run over',
  practiceDone: 'Practice round done',
  needed: 'needed',
  best: 'Best run',
  runScore: 'Run score',
  canvasLabel: 'Clay shooting field. Move the pointer to aim, click or tap to fire.',
  howToBody: [
    'Clays launch from the two barns. Aim at one and click or tap to fire.',
    'Your pellets need a moment to arrive, so aim a little ahead of a moving clay.',
    'Two shells per load. After the second shell the gun reloads by itself, or press R early.',
    'Break both clays of a double or crossing pair for a bonus. Consecutive hits build the combo.',
    'Small clays are worth more. Gold clays are worth the most.',
    'From round 3 the wind pushes clays off line.',
  ],
} as const;

export const RATING_NAMES: Record<Rating['id'], string> = {
  perfect: 'Straight Down the Line',
  ace: 'Sharp Shot',
  marksman: 'Steady Hand',
  sporting: 'Sporting Effort',
  novice: 'Warming Up',
  bystander: 'Just Watching',
};

export const outcomeNote = (o: RoundOutcome): string => (o === 'timeout' ? 'Time ran out.' : 'All clays thrown.');

export const windLabel = (kmh: number, dir: 'left' | 'right' | 'none'): string =>
  dir === 'none' ? S.calm : `${kmh} km/h ${dir === 'left' ? '←' : '→'}`;

export const hitsOf = (hits: number, total: number): string => `${hits} of ${total}`;
