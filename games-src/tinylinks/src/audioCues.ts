// Cue recipes for the WebAudio synth: pitched notes [freq, startSec, durSec, glideToFreq?] and noise bursts.
export type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth';
export interface Cue {
  wave: Wave;
  gain: number;
  notes: readonly (readonly [number, number, number, number?])[];
  /** Filtered noise: [startSec, durSec, lowpassHz, gain] */
  noise?: readonly [number, number, number, number];
}

const arp = (base: number, steps: readonly number[], gap: number, dur: number): [number, number, number][] =>
  steps.map((s, i) => [base * 2 ** (s / 12), i * gap, dur]);

export const CUES = {
  putt: { wave: 'sine', gain: 0.9, notes: [[210, 0, 0.12, 80]], noise: [0, 0.04, 2200, 0.25] },
  wall: { wave: 'triangle', gain: 0.5, notes: [[480, 0, 0.07, 340]] },
  post: { wave: 'sine', gain: 0.55, notes: [[760, 0, 0.1, 620]] },
  mover: { wave: 'square', gain: 0.18, notes: [[240, 0, 0.08, 160]] },
  sand: { wave: 'sine', gain: 0.05, notes: [[120, 0, 0.1]], noise: [0, 0.22, 900, 0.5] },
  splash: { wave: 'sine', gain: 0.5, notes: [[420, 0, 0.3, 140]], noise: [0, 0.38, 2400, 0.55] },
  sink: { wave: 'sine', gain: 0.8, notes: [[440, 0, 0.09, 300], [330, 0.1, 0.16, 220]], noise: [0.02, 0.1, 3000, 0.18] },
  par: { wave: 'triangle', gain: 0.6, notes: arp(392, [0, 4], 0.11, 0.2) },
  bogey: { wave: 'triangle', gain: 0.5, notes: arp(330, [0, -3], 0.12, 0.22) },
  birdie: { wave: 'triangle', gain: 0.7, notes: arp(392, [0, 4, 7, 12], 0.09, 0.24) },
  ace: { wave: 'square', gain: 0.32, notes: arp(392, [0, 4, 7, 12, 16, 19, 24], 0.075, 0.26) },
  turn: { wave: 'sine', gain: 0.4, notes: [[660, 0, 0.1], [880, 0.08, 0.14]] },
  done: { wave: 'triangle', gain: 0.65, notes: arp(330, [0, 7, 12, 16], 0.12, 0.3) },
  ui: { wave: 'sine', gain: 0.4, notes: [[560, 0, 0.06]] },
} as const satisfies Record<string, Cue>;

export type Sfx = keyof typeof CUES;
