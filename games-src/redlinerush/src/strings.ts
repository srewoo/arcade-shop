// Every user-facing string. Static markup is filled from here via data-str attributes.
import type { Mode, Outcome } from './simTypes';

export const STR = {
  gameName: 'Redline Rush',
  tagline: 'Thread the traffic. Skim past cars for bonus. Do not run dry.',
  settings: 'Settings',
  soundLabel: 'Sound',
  pause: 'Pause',
  paused: 'Paused',
  resume: 'Resume',
  restart: 'Restart run',
  quit: 'Quit to title',
  yes: 'Yes',
  keepPlaying: 'Keep playing',
  confirmRestart: 'Abandon this run and start over?',
  confirmQuit: 'Abandon this run and return to the title?',
  again: 'Race again',
  toTitle: 'Main menu',
  done: 'Done',
  hScore: 'Score', hSpeed: 'km/h', hLives: 'Armor', hTime: 'Time', hCheck: 'Checkpoint',
  hFuel: 'Fuel', hCombo: 'Combo', hDist: 'Distance', low: 'LOW',
  canvasLabel: 'Redline Rush road view: steer between lanes, dodge traffic',
  dismissHint: 'Dismiss hint',
  tLeft: 'Steer left', tRight: 'Steer right', tBrake: 'Brake', tGas: 'Accelerate',
  volume: 'Volume', sound: 'Sound', on: 'On', off: 'Off', muted: 'Muted', system: 'System',
  reduceMotion: 'Reduce motion', colorAssist: 'Colour-blind assist', textSize: 'Text size',
  theme: 'Theme', light: 'Light', dark: 'Dark',
  onboarding: 'Skim past a car without touching it for a CLOSE bonus. Arrows or A/D steer, Up/Down speed.',
  onboardingTouch: 'Skim past a car without touching it for a CLOSE bonus.',
  newBest: 'New best!',
  best: 'Best',
  noBest: 'No best yet',
  resultLabels: { score: 'Score', distance: 'Distance', near: 'Near misses', combo: 'Best combo', crashes: 'Crashes', time: 'Run time', checkpoints: 'Checkpoints' },
  howto: [
    'Arrows / WASD: steer, accelerate, brake. P or Esc pauses.',
    'Pass close to traffic without touching for near-miss bonus. Chain them for a bigger multiplier.',
    'Fuel runs down (not in Time Trial). Boost gives a burst of speed and double bonus.',
  ],
} as const;

export const TIER_LABEL = { rookie: 'Rookie', street: 'Street racer', ace: 'Road ace', legend: 'Redline legend' } as const;

export const TIPS = {
  noSkim: 'No near misses yet. Skim past a car with a thin gap, no contact, for +50 and a combo.',
  fuel: 'Orange fuel drops keep the tank up. Steer onto them when the bar goes low.',
  time: 'Boost pickups (blue) add speed and double skim bonus. Grab them to beat the clock.',
  crashes: 'Three hits ended this run. Ease off the gas before you change lanes in traffic.',
  chain: 'Chain skims inside 3 seconds to raise the multiplier up to x5.',
  finish: 'Clean finish. Try Endless to see how far the speed climbs.',
} as const;

export const MODE_INFO: Readonly<Record<Mode, { name: string; desc: string }>> = {
  endless: { name: 'Endless', desc: 'Go as far as armor and fuel allow. Speed keeps rising.' },
  trial: { name: 'Time Trial', desc: 'Reach every checkpoint before the clock runs out. Finish the course.' },
  daily: { name: 'Daily Seed', desc: 'Same road for everyone today. One best per day.' },
};

export const OUTCOME_TITLE: Readonly<Record<Outcome, string>> = {
  crash: 'Wrecked',
  fuel: 'Out of fuel',
  time: 'Time up',
  finish: 'Finish line!',
};

export const OUTCOME_SUB: Readonly<Record<Outcome, string>> = {
  crash: 'Your armor is gone.',
  fuel: 'The tank ran dry.',
  time: 'The clock beat you to the checkpoint.',
  finish: 'You cleared every checkpoint.',
};

export const announce = {
  count: (n: number): string => String(n),
  go: 'Go',
  crash: (lives: number): string => `Crash. ${lives} armor left.`,
  near: (combo: number, points: number): string => `Near miss. Combo ${combo}, plus ${points}.`,
  fuel: 'Fuel collected.',
  boost: 'Boost.',
  lowfuel: 'Fuel low.',
  checkpoint: (i: number, of: number): string => `Checkpoint ${i} of ${of}.`,
  over: (o: Outcome, score: number): string => `${OUTCOME_TITLE[o]}. Score ${score}.`,
};

export const fmtTime = (seconds: number): string => {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};
