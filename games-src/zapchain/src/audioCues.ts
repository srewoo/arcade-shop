// Cue table for the synthesised sounds: [frequency Hz, start s, duration s]. `step` (semitones)
// transposes tonal cues at play time, so zap pitch can rise with the chain size.
import { CONFIG } from './config';

export type Sfx = 'start' | 'spawn' | 'zap' | 'bomb' | 'invalid' | 'land' | 'warn' | 'wipe' | 'cleared' | 'over' | 'best' | 'ui' | 'pause';
export type Note = readonly [freq: number, at: number, dur: number];
export interface Noise { readonly dur: number; readonly from: number; readonly to: number; readonly gain: number }
export interface Cue { readonly wave: OscillatorType; readonly gain: number; readonly notes: readonly Note[]; readonly noise?: Noise }
export interface CueOpts { readonly delay?: number; readonly step?: number }

const g = CONFIG.audio.cueGain;

export const CUES: Readonly<Record<Sfx, Cue>> = {
  start: { wave: 'triangle', gain: g, notes: [[392, 0, 0.08], [587, 0.08, 0.16]] },
  spawn: { wave: 'sine', gain: g * 0.45, notes: [[330, 0, 0.09]] },
  zap: { wave: 'square', gain: g * 0.5, notes: [[523, 0, 0.07], [659, 0.05, 0.08], [784, 0.1, 0.16]], noise: { dur: 0.16, from: 6000, to: 1500, gain: g * 0.9 } },
  bomb: { wave: 'sawtooth', gain: g * 0.9, notes: [[110, 0, 0.3], [62, 0.05, 0.45]], noise: { dur: 0.6, from: 3200, to: 140, gain: g * 2 } },
  invalid: { wave: 'sawtooth', gain: g * 0.5, notes: [[150, 0, 0.09], [118, 0.07, 0.12]] },
  land: { wave: 'sine', gain: g * 0.5, notes: [[96, 0, 0.07]] },
  warn: { wave: 'square', gain: g * 0.45, notes: [[880, 0, 0.09], [660, 0.12, 0.09], [880, 0.3, 0.09], [660, 0.42, 0.09]] },
  wipe: { wave: 'triangle', gain: g, notes: [[659, 0, 0.08], [784, 0.08, 0.08], [988, 0.16, 0.08], [1319, 0.24, 0.24]] },
  cleared: { wave: 'triangle', gain: g, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.3]] },
  over: { wave: 'sawtooth', gain: g * 0.8, notes: [[392, 0, 0.15], [330, 0.15, 0.15], [262, 0.3, 0.15], [196, 0.45, 0.4]] },
  best: { wave: 'triangle', gain: g, notes: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.26]] },
  ui: { wave: 'triangle', gain: g * 0.7, notes: [[440, 0, 0.05]] },
  pause: { wave: 'sine', gain: g * 0.7, notes: [[392, 0, 0.07], [294, 0.07, 0.1]] },
};

/** Spawn tones climb a pentatonic scale across the row, like the original's five tones. */
export const SPAWN_STEPS = [0, 2, 4, 7, 9] as const;
