// All user-facing text in one module (no i18n framework).
import type { MoveFailure, Pack } from './puzzle/types';

export const S = {
  title: 'Lantern Bridge',
  tagline: 'Cross in the dark, together, before the oil runs out.',
  packs: {
    bridge: { name: 'Bridge by Night', blurb: 'One lantern, two at a time, a time limit.' },
    raft: { name: 'Raft Rules', blurb: 'Who may ride with whom? Rules decide.' },
    daily: { name: 'Daily Lantern', blurb: 'A new seeded bridge every day.' },
  },
  menu: { play: 'Play', help: 'How to play', settings: 'Settings', levels: 'Levels', back: 'Back' },
  hud: {
    time: (used: number, limit: number): string => `Oil used ${used} of ${limit} min`,
    crossings: (n: number): string => `Crossings ${n}`,
    level: (n: number, total: number): string => `Level ${n} of ${total}`,
  },
  actions: { cross: 'Cross', undo: 'Undo', hint: 'Hint', restart: 'Restart', menu: 'Levels', pause: 'Pause' },
  onboard: {
    bridge: 'Pick up to two, press Cross. The lantern must come back. Hints cap stars at 2.',
    raft: 'Pick travellers and press Cross. Only travellers with a Row badge can steer. Check the rules before you go.',
  } satisfies Record<Pack, string>,
  status: {
    start: 'Pick who walks first.',
    picked: (names: string): string => `Ready to cross: ${names}.`,
    lanternBack: 'Bring the lantern back with someone.',
    raftBack: 'Bring the raft back with a rower.',
    stuck: 'No route fits the oil from here. Undo or restart.',
    wrongSide: 'They are on the other bank.',
    full: (n: number): string => `At most ${n} can cross at once.`,
    crossed: (names: string, cost: number, pack: Pack): string =>
      pack === 'bridge' ? `${names} crossed in ${cost} min.` : `${names} crossed.`,
    hint: (names: string): string => `Hint: send ${names}.`,
    noHint: 'No hint: there is no route that fits from here.',
    undone: 'Undid the last crossing.',
  },
  fail: {
    empty: 'Pick at least one traveller first.',
    'too-many': 'Too many for the crossing.',
    'wrong-side': 'Someone picked is on the other bank.',
    'no-rower': 'Someone with an oar has to steer the raft.',
    rule: 'That breaks a rule.',
  } satisfies Record<MoveFailure, string>,
  result: {
    won: 'Everyone is across',
    lost: 'The lantern goes out',
    lostBody: (used: number, limit: number): string => `That crossing used ${used} min and the oil only lasts ${limit}. Undo the last step or restart.`,
    wonBridge: (cost: number, par: number): string => `Total ${cost} min. Best route: ${par} min.`,
    wonRaft: (moves: number, par: number): string => `${moves} crossings. Best route: ${par}.`,
    perfect: 'Perfect: the best route, no hints.',
    bestWithHint: 'You found the best route, but a hint was used, so the stars stop at 2.',
    hintNote: 'A hint was used, so the stars stop at 2.',
    starCapped: 'withheld by a hint',
    next: 'Next level',
    retry: 'Play again',
    route: 'Show best route',
    levels: 'Levels',
    undo: 'Undo last step',
    restart: 'Restart',
    close: 'Close',
  },
  rules: {
    summary: 'Rules',
    summaryFor: (pack: Pack, cap: number): string => (pack === 'bridge' ? `Rules: ${cap} at a time, slowest sets the pace` : `Rules: raft holds ${cap}, rowers steer`),
    base: (pack: Pack, cap: number): string =>
      pack === 'bridge' ? `Up to ${cap} cross at once, at the slower walker's pace. The lantern must come back.` : `The raft holds ${cap}. Only travellers with a Row badge can steer.`,
    stars: '3 stars: best route, no hints',
    hintCap: 'Using a hint caps your stars at 2',
  },
  min: 'min',
  route: { title: 'Best route', empty: 'Nobody to move.' },
  pause: { title: 'Paused', resume: 'Resume', restart: 'Restart', settings: 'Settings', quit: 'Quit to levels' },
  confirm: {
    restart: 'Restart this level? Your crossings so far will be lost.',
    quit: 'Leave this level? Your crossings so far will be lost.',
    reset: 'Reset all stars and progress? This cannot be undone.',
    yes: 'Yes',
    no: 'Keep playing',
  },
  settings: {
    title: 'Settings', volume: 'Volume', motion: 'Reduce motion', assist: 'Colour-blind assist',
    text: 'Text size', theme: 'Theme', reset: 'Reset progress', close: 'Done',
    motionOpts: { system: 'System', on: 'On', off: 'Off' },
    themeOpts: { system: 'System', light: 'Light', dark: 'Dark' },
    onOff: { on: 'On', off: 'Off' },
  },
  help: {
    title: 'How to play',
    lines: [
      'Everyone starts on the left bank (the start). Get all of them to the right bank.',
      'Bridge: at most two cross together, they walk at the slower speed, and the lantern must come back with someone.',
      'Stay inside the oil limit. Three stars means the best route with no hints; using a hint caps you at two.',
      'Raft: only rowers can steer, and the rules about who may be together apply on both banks and on the raft.',
      'Keys: 1-8 pick travellers, C cross, U undo, R restart, H hint, M mute, P or Esc pause.',
    ],
  },
  daily: { title: 'Daily Lantern', date: (d: string): string => `Today, ${d}` },
  stars: (n: number): string => `${n} of 3 stars`,
  sound: { on: 'Sound on', off: 'Sound off' },
  announce: { won: (n: number): string => `Level complete. ${n} stars.`, lost: 'The lantern went out. Undo or restart.' },
} as const;

export const DIRECTION = { toGoal: 'cross', toStart: 'return' } as const;
