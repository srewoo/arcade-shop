// Cue table for the synthesised sounds: [frequency Hz, start s, duration s].
import { CONFIG } from './config';

export type Sfx = 'x' | 'o' | 'vanish' | 'win' | 'lose' | 'draw' | 'start' | 'ui' | 'deny' | 'warn';
export type Note = readonly [freq: number, at: number, dur: number];

export interface Cue {
  readonly wave: OscillatorType;
  /** Peak gain per note (before master volume). */
  readonly gain: number;
  readonly notes: readonly Note[];
}

const { xGain, oGain, cueGain } = CONFIG.audio;

export const CUES: Readonly<Record<Sfx, Cue>> = {
  x: { wave: 'square', gain: xGain, notes: [[520, 0, 0.08]] },
  o: { wave: 'triangle', gain: oGain, notes: [[390, 0, 0.08]] },
  vanish: { wave: 'triangle', gain: cueGain, notes: [[300, 0, 0.06], [220, 0.05, 0.08]] },
  win: { wave: 'triangle', gain: cueGain, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.22]] },
  lose: { wave: 'triangle', gain: cueGain, notes: [[392, 0, 0.12], [330, 0.12, 0.12], [262, 0.24, 0.25]] },
  draw: { wave: 'triangle', gain: cueGain, notes: [[440, 0, 0.1], [440, 0.14, 0.1]] },
  start: { wave: 'sine', gain: cueGain, notes: [[330, 0, 0.07], [494, 0.06, 0.1]] },
  ui: { wave: 'sine', gain: 0.1, notes: [[880, 0, 0.03]] },
  deny: { wave: 'sine', gain: 0.22, notes: [[90, 0, 0.14]] },
  warn: { wave: 'triangle', gain: cueGain, notes: [[660, 0, 0.07], [660, 0.12, 0.07]] },
};
