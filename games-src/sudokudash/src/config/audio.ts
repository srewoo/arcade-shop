// Synth cue table. Each note is [frequency Hz, start s, duration s]. Peak gains are per note;
// everything goes through one master gain and a limiter so overlapping cues stay below -6 dBFS.
export type Sfx =
  | 'tap' | 'note' | 'correct' | 'combo' | 'mistake' | 'hint' | 'win' | 'lose'
  | 'erase' | 'undo' | 'redo' | 'pause' | 'resume' | 'tick' | 'record' | 'start' | 'solve';

export type Note = readonly [freq: number, at: number, dur: number];
export type Wave = 'triangle' | 'sawtooth' | 'sine' | 'square';

export interface Cue {
  readonly notes: readonly Note[];
  readonly wave: Wave;
  readonly gain: number;
}

export const CUES: Readonly<Record<Sfx, Cue>> = {
  tap: { notes: [[440, 0, 0.04]], wave: 'triangle', gain: 0.1 },
  note: { notes: [[660, 0, 0.03]], wave: 'triangle', gain: 0.12 },
  correct: { notes: [[523, 0, 0.07], [784, 0.06, 0.1]], wave: 'triangle', gain: 0.16 },
  combo: { notes: [[659, 0, 0.06], [880, 0.06, 0.06], [1175, 0.12, 0.12]], wave: 'triangle', gain: 0.14 },
  mistake: { notes: [[196, 0, 0.14], [147, 0.1, 0.22]], wave: 'sawtooth', gain: 0.1 },
  hint: { notes: [[587, 0, 0.08], [440, 0.09, 0.1]], wave: 'triangle', gain: 0.16 },
  win: { notes: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.34]], wave: 'triangle', gain: 0.16 },
  lose: { notes: [[392, 0, 0.16], [330, 0.16, 0.16], [262, 0.32, 0.34]], wave: 'sawtooth', gain: 0.1 },
  erase: { notes: [[330, 0, 0.05], [247, 0.04, 0.06]], wave: 'triangle', gain: 0.12 },
  undo: { notes: [[494, 0, 0.05], [370, 0.05, 0.07]], wave: 'sine', gain: 0.14 },
  redo: { notes: [[370, 0, 0.05], [494, 0.05, 0.07]], wave: 'sine', gain: 0.14 },
  pause: { notes: [[392, 0, 0.07], [294, 0.07, 0.1]], wave: 'sine', gain: 0.14 },
  resume: { notes: [[294, 0, 0.07], [392, 0.07, 0.1]], wave: 'sine', gain: 0.14 },
  tick: { notes: [[1000, 0, 0.03]], wave: 'square', gain: 0.05 },
  record: { notes: [[784, 0, 0.1], [988, 0.1, 0.1], [1319, 0.2, 0.1], [1568, 0.3, 0.3]], wave: 'sine', gain: 0.14 },
  start: { notes: [[392, 0, 0.08], [523, 0.08, 0.08], [659, 0.16, 0.14]], wave: 'triangle', gain: 0.14 },
  solve: { notes: [[392, 0, 0.06], [523, 0.06, 0.06], [659, 0.12, 0.06], [784, 0.18, 0.12]], wave: 'sine', gain: 0.12 },
};

export const MASTER_GAIN = 0.6;
/** Safety limiter ceiling: -6 dBFS is 0.5 linear. */
export const PEAK_CEILING = 0.5;
