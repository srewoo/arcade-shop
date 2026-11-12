// Cue table for the synthesised sounds (no audio files). Each cue is a list of voices.
export type Sfx = 'ui' | 'lock' | 'throw' | 'roll' | 'hit' | 'wobble' | 'scare' | 'yowl' | 'cushion' | 'fish' | 'strike' | 'spare' | 'gutter' | 'over' | 'start';

export interface Voice {
  readonly kind: 'tone' | 'noise';
  readonly wave?: OscillatorType;
  /** Start / end frequency in Hz (tone) or filter cutoff (noise). */
  readonly f0: number;
  readonly f1?: number;
  readonly at: number;
  readonly dur: number;
  readonly gain: number;
  /** Low-pass cutoff applied to the voice. */
  readonly lp?: number;
}

const tone = (wave: OscillatorType, f0: number, f1: number, at: number, dur: number, gain: number, lp?: number): Voice =>
  ({ kind: 'tone', wave, f0, f1, at, dur, gain, ...(lp ? { lp } : {}) });
const noise = (cut: number, at: number, dur: number, gain: number): Voice => ({ kind: 'noise', f0: cut, at, dur, gain });

export const CUES: Readonly<Record<Sfx, readonly Voice[]>> = {
  ui: [tone('sine', 880, 880, 0, 0.04, 0.1)],
  lock: [tone('square', 660, 880, 0, 0.07, 0.12), tone('square', 990, 990, 0.07, 0.06, 0.1)],
  throw: [noise(900, 0, 0.25, 0.2), tone('triangle', 300, 160, 0, 0.2, 0.15)],
  roll: [noise(220, 0, 1.5, 0.22)],
  hit: [tone('sine', 150, 60, 0, 0.18, 0.4), noise(1400, 0, 0.09, 0.25)],
  wobble: [tone('sine', 300, 520, 0, 0.12, 0.2), tone('sine', 520, 260, 0.12, 0.2, 0.2)],
  scare: [tone('square', 900, 1500, 0, 0.1, 0.12, 2400), tone('square', 1500, 1100, 0.1, 0.08, 0.1, 2400)],
  yowl: [tone('sawtooth', 460, 760, 0, 0.16, 0.2, 1700), tone('sawtooth', 760, 360, 0.16, 0.3, 0.2, 1500)],
  cushion: [noise(500, 0, 0.18, 0.3), tone('sine', 110, 70, 0, 0.18, 0.25)],
  fish: [tone('sine', 700, 1100, 0, 0.1, 0.22), tone('sine', 1100, 1500, 0.1, 0.12, 0.2)],
  strike: [tone('triangle', 523, 523, 0, 0.12, 0.3), tone('triangle', 659, 659, 0.1, 0.12, 0.3), tone('triangle', 784, 784, 0.2, 0.12, 0.3), tone('triangle', 1047, 1047, 0.3, 0.4, 0.32)],
  spare: [tone('triangle', 523, 523, 0, 0.1, 0.28), tone('triangle', 784, 784, 0.12, 0.25, 0.28)],
  gutter: [tone('triangle', 330, 220, 0, 0.28, 0.25), tone('triangle', 220, 110, 0.28, 0.4, 0.25)],
  over: [tone('triangle', 392, 392, 0, 0.14, 0.28), tone('triangle', 494, 494, 0.14, 0.14, 0.28), tone('triangle', 587, 587, 0.28, 0.14, 0.28), tone('triangle', 784, 784, 0.42, 0.5, 0.3)],
  start: [tone('sine', 330, 330, 0, 0.07, 0.2), tone('sine', 494, 494, 0.07, 0.12, 0.2)],
};
