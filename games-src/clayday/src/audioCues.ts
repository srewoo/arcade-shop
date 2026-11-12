// Sound recipes. Each cue is a list of oscillator or noise segments; nothing
// is loaded from the network. Times are seconds from the cue start.
export type Sfx =
  | 'shot' | 'launch' | 'crack' | 'thud' | 'reload' | 'loaded' | 'dry' | 'double'
  | 'combo' | 'pass' | 'fail' | 'tick' | 'click' | 'pull';

export interface Seg {
  readonly kind: 'osc' | 'noise';
  readonly at: number;
  readonly dur: number;
  readonly gain: number;
  readonly wave?: OscillatorType;
  readonly f0?: number;
  readonly f1?: number;
  /** Filter: low-pass or high-pass cutoff (noise only). */
  readonly lp?: number;
  readonly hp?: number;
}

const tone = (f0: number, at: number, dur: number, gain: number, wave: OscillatorType = 'triangle', f1?: number): Seg =>
  ({ kind: 'osc', at, dur, gain, wave, f0, ...(f1 !== undefined ? { f1 } : {}) });
const hiss = (at: number, dur: number, gain: number, f: { lp?: number; hp?: number }): Seg => ({ kind: 'noise', at, dur, gain, ...f });

export const CUES: Record<Sfx, readonly Seg[]> = {
  shot: [hiss(0, 0.22, 0.9, { lp: 2400 }), tone(150, 0, 0.18, 0.7, 'sine', 45)],
  launch: [hiss(0, 0.28, 0.25, { lp: 900 }), tone(320, 0, 0.14, 0.25, 'triangle', 180)],
  pull: [tone(660, 0, 0.08, 0.3, 'square'), tone(880, 0.1, 0.12, 0.3, 'square')],
  crack: [hiss(0, 0.12, 0.55, { hp: 2600 }), tone(1300, 0, 0.09, 0.3, 'triangle', 600)],
  thud: [tone(110, 0, 0.12, 0.35, 'sine', 60), hiss(0, 0.08, 0.15, { lp: 500 })],
  reload: [hiss(0, 0.05, 0.4, { hp: 1800 }), hiss(0.16, 0.06, 0.4, { hp: 1400 }), tone(220, 0.16, 0.05, 0.2, 'square')],
  loaded: [hiss(0, 0.05, 0.45, { hp: 1000 }), tone(480, 0, 0.06, 0.2, 'square')],
  dry: [hiss(0, 0.03, 0.35, { hp: 2200 })],
  double: [tone(523, 0, 0.1, 0.3), tone(659, 0.08, 0.1, 0.3), tone(784, 0.16, 0.18, 0.3)],
  combo: [tone(988, 0, 0.07, 0.22, 'sine'), tone(1319, 0.06, 0.1, 0.22, 'sine')],
  pass: [tone(523, 0, 0.12, 0.3), tone(659, 0.12, 0.12, 0.3), tone(784, 0.24, 0.12, 0.3), tone(1047, 0.36, 0.3, 0.3)],
  fail: [tone(392, 0, 0.18, 0.3, 'sawtooth'), tone(330, 0.18, 0.18, 0.3, 'sawtooth'), tone(262, 0.36, 0.34, 0.3, 'sawtooth')],
  tick: [tone(880, 0, 0.05, 0.25, 'square')],
  click: [tone(700, 0, 0.04, 0.2, 'square')],
};
