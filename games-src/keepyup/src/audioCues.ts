// Cue table for the synthesised sounds: [frequency Hz, start s, duration s].
import { CONFIG } from './config';

export type Sfx = 'start' | 'hit' | 'sweet' | 'wall' | 'whiff' | 'tier' | 'miss' | 'best' | 'gust' | 'ui' | 'pause';
export type Note = readonly [freq: number, at: number, dur: number];
export interface Cue { readonly wave: OscillatorType; readonly gain: number; readonly notes: readonly Note[] }

const g = CONFIG.audio.cueGain;

export const CUES: Readonly<Record<Sfx, Cue>> = {
  start: { wave: 'triangle', gain: g, notes: [[330, 0, 0.08], [494, 0.08, 0.14]] },
  hit: { wave: 'triangle', gain: g * 0.9, notes: [[260, 0, 0.05], [190, 0.02, 0.07]] },
  sweet: { wave: 'triangle', gain: g, notes: [[330, 0, 0.05], [440, 0.03, 0.06], [880, 0.06, 0.09]] },
  wall: { wave: 'sine', gain: g * 0.6, notes: [[150, 0, 0.08]] },
  whiff: { wave: 'sine', gain: g * 0.35, notes: [[520, 0, 0.04], [380, 0.03, 0.06]] },
  tier: { wave: 'square', gain: g * 0.55, notes: [[523, 0, 0.09], [659, 0.09, 0.09], [784, 0.18, 0.09], [1047, 0.27, 0.22]] },
  miss: { wave: 'sawtooth', gain: g * 0.8, notes: [[196, 0, 0.12], [147, 0.1, 0.14], [98, 0.22, 0.3]] },
  best: { wave: 'triangle', gain: g, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.26]] },
  gust: { wave: 'sine', gain: g * 0.3, notes: [[110, 0, 0.5], [140, 0.2, 0.5]] },
  ui: { wave: 'triangle', gain: g * 0.7, notes: [[440, 0, 0.05]] },
  pause: { wave: 'sine', gain: g * 0.7, notes: [[392, 0, 0.07], [294, 0.07, 0.1]] },
};
