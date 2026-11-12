// User-facing strings. One place, no i18n framework.
import type { Modifier } from './levels';

export const STR = Object.freeze({
  hud: Object.freeze({
    score: 'SCORE', hi: 'HI', level: 'LEVEL', demo: 'DEMO', sound: 'SOUND [M]', muted: 'MUTED [M]',
    grooming: 'Cats are grooming', water: 'WATER', aria: 'Status',
    lives: (n: number) => `${n} ${n === 1 ? 'life' : 'lives'} left`,
  }),
  title: Object.freeze({
    name: 'CRUMB RUN',
    tagline: 'Pip the mouse vs. the night-shift cats',
    goal: 'Eat every crumb. Grab a water pistol to drench the cats.',
    play: 'PRESS ENTER OR TAP TO PLAY',
    start: 'Start', how: 'How to play',
    keys: 'Arrows / WASD steer  |  P pause  |  O settings  |  M mute',
    controls1: 'Arrows / WASD / swipe to steer',
    controls2: 'P pause | O settings | M mute',
  }),
  ready: 'READY!',
  coach: Object.freeze({
    first: 'Eat every crumb. Grab a water pistol to drench the cats.',
  }),
  summary: Object.freeze({
    clear: 'CLEAR!', next: 'ENTER / TAP FOR NEXT LEVEL', crumbs: 'Crumbs eaten', splashes: 'Cats splashed',
    chain: 'Best chain', cheese: 'Cheese found', time: 'Time', score: 'Level score',
  }),
  modifier: Object.freeze<Record<Modifier, string>>({
    none: '', fastCats: 'FASTER CATS', darkKitchen: 'DARK KITCHEN', quickRelease: 'CATS ESCAPE SOONER',
  }),
  cats: Object.freeze({ smudge: 'SMUDGE', biscuit: 'BISCUIT', tuxedo: 'TUXEDO', ginger: 'GINGER' }),
  pause: Object.freeze({
    title: 'Paused', auto: 'Paused because the window lost focus.', resume: 'Resume', restart: 'Restart',
    settings: 'Settings', quit: 'Quit to title', hint: 'Esc or P resumes. Tap outside the menu to resume.',
    confirmRestart: 'Restart this run?', confirmQuit: 'Quit to the title screen?',
    confirmBody: 'Your current run will end. Your score is saved if it makes the top 5.',
    yesRestart: 'Yes, restart', yesQuit: 'Yes, quit', cancel: 'Keep playing',
  }),
  settings: Object.freeze({
    title: 'Settings', volume: 'Volume', reduceMotion: 'Reduce motion', system: 'Auto', on: 'On', off: 'Off',
    colorAssist: 'Colour-blind assist', textSize: 'Text size', highContrast: 'High contrast',
    showDpad: 'Show d-pad', leftHanded: 'Left-handed d-pad', howTo: 'How to play', done: 'Done',
    open: 'Settings', mute: 'Mute sound',
  }),
  howTo: Object.freeze({
    title: 'How to play', dismiss: 'Press any key or tap to start',
    cards: Object.freeze([
      { head: '1. Steer Pip', body: 'Arrows, WASD or swipe. Eat every crumb and sugar cube. Cats are deadly.' },
      { head: '2. Grab a water pistol', body: 'Cats turn blue, flee and can be splashed. Chain splashes for bonus points.' },
      { head: '3. Cheese and mouse-holes', body: 'Cheese is worth 500 for a few seconds. The side holes wrap around. Cats rest every so often.' },
    ] as readonly { head: string; body: string }[]),
  }),
  gameOver: Object.freeze({
    title: 'Game over', score: 'Score', level: 'Level reached', splashes: 'Cats splashed', chain: 'Best chain',
    bestLevel: 'Best level ever', newHigh: 'New high score!', high: 'High score', top5: 'Top 5', again: 'Play again', toTitle: 'Title',
    empty: 'No scores yet',
  }),
  rotate: 'Small screen: rotate or enlarge the window for a bigger board.',
  aria: Object.freeze({
    canvas: 'Crumb Run game board. Steer Pip the mouse with arrow keys, WASD, swipe or the on-screen d-pad.',
    stage: 'Crumb Run game area',
    pause: 'Pause', mute: 'Toggle sound', settings: 'Open settings', dpad: 'Directional pad',
    up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  }),
  announce: Object.freeze({
    started: (lvl: number) => `Level ${lvl}. Go.`,
    cleared: (lvl: number, pts: number) => `Level ${lvl} clear. ${pts} points this level.`,
    life: (left: number) => (left > 0 ? `Caught. ${left} ${left === 1 ? 'life' : 'lives'} left.` : 'Caught. No lives left.'),
    over: (score: number, high: boolean) => `Game over. Score ${score}.${high ? ' New high score.' : ''}`,
    rest: 'The cats are grooming.', chase: 'The cats are hunting again.',
    drench: 'Water pistol. Cats are drenched.', extra: 'Extra life.', paused: 'Paused.', resumed: 'Resumed.',
    cheese: 'Cheese appeared.', pounce: 'A cat is winding up to pounce.',
  }),
});
