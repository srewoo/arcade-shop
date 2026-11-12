// User-facing strings for the polish-pass UI (no i18n framework, just one place to read and edit).
export const S = {
  title: {
    start: 'START',
    loading: 'LOADING',
    starting: 'STARTING',
    ctaLoading: 'SPACE OR TAP QUEUES YOUR START',
    ctaQueued: 'STARTING THE MOMENT IT LOADS',
    ctaKeys: 'PRESS SPACE TO RUN',
    ctaChip: 'PRESS ENTER ON START',
    ctaTouch: 'TAP START TO RUN',
    settingsAria: 'Settings',
    pauseAria: 'Pause',
    helpAria: 'Show controls',
    helpTitle: 'Controls',
  },
  pause: {
    title: 'PAUSED',
    sub: 'Space to resume',
    resume: 'RESUME',
    restart: 'RESTART',
    settings: 'SETTINGS',
    quit: 'QUIT TO TITLE',
    confirmRestart: 'Restart this run? Your score will be lost.',
    confirmQuit: 'Quit to the title screen? Your score will be lost.',
    confirmEnd: 'End this run and see your result?',
    yes: 'YES',
    no: 'NO',
    endRun: 'END RUN',
    reasonBlur: 'Paused: the window lost focus',
    reasonHidden: 'Paused: the tab was hidden',
  },
  coach: {
    jump: { keys: 'Space or Up to jump', touch: 'tap to jump' },
    duck: { keys: 'DUCK: hold the Down key', touch: 'DUCK: swipe down' },
    shield: { all: 'absorbs one hit' },
    doublejump: { keys: 'press jump again in the air', touch: 'tap again in the air' },
    slowmo: { all: 'time slows down for a few seconds' },
    score2: { all: 'points count double' },
  },
  hints: {
    keys: 'Space jump · Down duck',
    more: 'P or Esc pause · M mute · Double Jump: press jump again in the air',
    keysTitle: ' · Left/Right or 1-4 mode · W environment · S settings · A autoplay · H hide UI',
    touch: 'tap jump · swipe down duck',
    touchMore: 'pause button top right',
    touchTitle: ' · pick a mode above',
  },
  countdown: ['1', '2', '3'],
  over: {
    unranked: 'UNRANKED',
    unrankedWhy: {
      difficulty: 'not Normal difficulty',
      classicPlus: 'Classic Plus is on',
      snow: 'Snow changes landings',
    },
    offline: 'Leaderboard offline. Your score is saved on this device.',
    retry: 'RETRY',
    saveFailed: "Couldn't save, try again",
  },
  settings: {
    textSize: 'Text size',
    motion: 'Reduce motion',
    motionOpts: { system: 'System', on: 'On', off: 'Off' },
    colorAssist: 'Colour-blind assist (symbols on power-ups and the clock)',
    theme: 'Theme',
    themeOpts: { system: 'System', light: 'Light', dark: 'Dark' },
    mute: 'Mute sound',
    powerups: 'Power-ups',
    powerupsSub: 'Hardcore, Zen and Time Attack',
    classicPlus: 'Classic Plus',
    classicPlusSub: 'Power-ups and new obstacles in Classic (unranked)',
    snowSub: 'Snow: floatier landings (unranked)',
  },
  fps: 'FPS',
};

/** Run-summary line for the game-over card, e.g. "412 m, 3 pickups, 7 cleared, best 00500". */
export function summaryLine({ dist = 0, pickups = 0, cleared = 0, best = 0 }) {
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return `${Math.floor(dist)} m, ${plural(pickups, 'pickup', 'pickups')}, ${cleared} cleared, best ${String(Math.max(0, Math.floor(best))).padStart(5, '0')}`;
}

/** Title CTA wording: touch screens use the START button; with a chip focused Space would pick the chip, so say Enter on START. */
export function ctaText(chipFocused, coarse, phase = 'ready') {
  if (phase === 'loading') return S.title.ctaLoading;
  if (phase === 'queued') return S.title.ctaQueued;
  if (coarse) return S.title.ctaTouch;
  return chipFocused ? S.title.ctaChip : S.title.ctaKeys;
}
