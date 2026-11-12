// Cue table for the synthesised sounds: [frequency Hz, start s, duration s].
import { CONFIG } from './config';

export type Sfx = 'start' | 'rise' | 'coin' | 'crash' | 'best' | 'ui' | 'pause';
export type Note = readonly [freq: number, at: number, dur: number];
export interface Cue { readonly wave: OscillatorType; readonly gain: number; readonly notes: readonly Note[] }

const g = CONFIG.audio.cueGain;

export const CUES: Readonly<Record<Sfx, Cue>> = {
  start: { wave: 'triangle', gain: g, notes: [[330, 0, 0.08], [494, 0.08, 0.14]] },
  rise: { wave: 'sine', gain: g * 0.5, notes: [[210, 0, 0.07]] },
  coin: { wave: 'square', gain: g * 0.6, notes: [[988, 0, 0.06], [1319, 0.06, 0.14]] },
  crash: { wave: 'sawtooth', gain: g, notes: [[220, 0, 0.12], [150, 0.1, 0.14], [90, 0.22, 0.3]] },
  best: { wave: 'triangle', gain: g, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.26]] },
  ui: { wave: 'triangle', gain: g * 0.7, notes: [[440, 0, 0.05]] },
  pause: { wave: 'sine', gain: g * 0.7, notes: [[392, 0, 0.07], [294, 0.07, 0.1]] },
};
