// Synthesised sound effects as data: [frequency Hz, duration s, wave, gain, delay s, slide-to Hz?].
// Gains are pre-bus linear values tuned so post-bus peaks sit near the mix targets
// (move -24 dBFS, rotate -22, lock -14, clears -12), checked by the debug mix meter.
export type Wave = OscillatorType;
export type ToneSpec = readonly [freq: number, dur: number, wave: Wave, gain: number, delay?: number, slideTo?: number];

export const SFX_NAMES = [
  'move', 'rotate', 'lock', 'hardDrop', 'stash', 'clear1', 'clear4', 'twist', 'levelUp', 'over', 'win',
  'uiClick', 'pause', 'resume', 'start', 'deny', 'softDrop', 'garbage', 'wipe', 'combo', 'b2b', 'allClear', 'newBest', 'warn', 'tick',
] as const;
export type Sfx = (typeof SFX_NAMES)[number];

export const SFX_TABLE: Readonly<Record<Exclude<Sfx, 'combo'>, readonly ToneSpec[]>> = {
  move: [[520, 0.04, 'triangle', 0.08]],
  rotate: [[660, 0.06, 'triangle', 0.1, 0, 780]],
  lock: [[180, 0.09, 'sine', 0.25, 0, 110]],
  hardDrop: [[240, 0.14, 'triangle', 0.3, 0, 70]],
  stash: [[420, 0.08, 'sine', 0.12, 0, 300], [300, 0.08, 'sine', 0.12, 0.06, 420]],
  clear1: [[523, 0.2, 'sine', 0.2], [659, 0.2, 'sine', 0.2, 0.06], [784, 0.2, 'sine', 0.2, 0.12]],
  clear4: [[392, 0.35, 'triangle', 0.2], [523, 0.35, 'triangle', 0.2, 0.07], [659, 0.35, 'triangle', 0.2, 0.14], [784, 0.35, 'triangle', 0.2, 0.21], [1047, 0.35, 'triangle', 0.2, 0.28]],
  twist: [[587, 0.22, 'sine', 0.2], [740, 0.22, 'sine', 0.2, 0.05], [880, 0.22, 'sine', 0.2, 0.1], [1175, 0.22, 'sine', 0.2, 0.15]],
  levelUp: [[440, 0.3, 'sine', 0.2], [554, 0.3, 'sine', 0.2, 0.1], [659, 0.3, 'sine', 0.2, 0.2], [880, 0.3, 'sine', 0.2, 0.3]],
  over: [[330, 0.4, 'triangle', 0.2], [262, 0.4, 'triangle', 0.2, 0.18], [196, 0.4, 'triangle', 0.2, 0.36], [131, 0.4, 'triangle', 0.2, 0.54]],
  win: [[523, 0.3, 'sine', 0.2], [659, 0.3, 'sine', 0.2, 0.12], [784, 0.3, 'sine', 0.2, 0.24], [1047, 0.3, 'sine', 0.2, 0.36], [784, 0.3, 'sine', 0.2, 0.48], [1047, 0.3, 'sine', 0.2, 0.6]],
  uiClick: [[880, 0.03, 'triangle', 0.09]],
  pause: [[440, 0.1, 'sine', 0.14, 0, 330]],
  resume: [[330, 0.1, 'sine', 0.14, 0, 440]],
  start: [[392, 0.12, 'sine', 0.14], [523, 0.12, 'sine', 0.14, 0.09], [659, 0.22, 'sine', 0.18, 0.18]],
  deny: [[150, 0.08, 'square', 0.06, 0, 110]],
  softDrop: [[300, 0.025, 'sine', 0.05]],
  garbage: [[110, 0.25, 'sawtooth', 0.09, 0, 70], [82, 0.25, 'sine', 0.16, 0.02, 55]],
  wipe: [[660, 0.4, 'sine', 0.16, 0, 330], [880, 0.4, 'sine', 0.12, 0.05, 440]],
  b2b: [[784, 0.1, 'triangle', 0.14], [988, 0.14, 'triangle', 0.14, 0.07]],
  allClear: [[523, 0.3, 'sine', 0.18], [659, 0.3, 'sine', 0.18, 0.08], [784, 0.3, 'sine', 0.18, 0.16], [1047, 0.3, 'sine', 0.18, 0.24], [1319, 0.4, 'sine', 0.18, 0.32]],
  newBest: [[659, 0.12, 'triangle', 0.16], [784, 0.12, 'triangle', 0.16, 0.1], [1047, 0.3, 'triangle', 0.18, 0.2]],
  warn: [[220, 0.15, 'square', 0.06], [220, 0.15, 'square', 0.06, 0.22]],
  tick: [[1000, 0.03, 'sine', 0.1]],
};
