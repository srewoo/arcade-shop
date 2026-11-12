// Cue definitions: [frequency Hz, start s, duration s] triples per oscillator wave.
export type Sfx = 'tap' | 'step' | 'jump' | 'deny' | 'undo' | 'hint' | 'stuck' | 'win' | 'star' | 'open' | 'close';

export interface Cue {
  readonly wave: OscillatorType;
  readonly gain: number;
  readonly notes: readonly (readonly [number, number, number])[];
}

export const CUES: Readonly<Record<Sfx, Cue>> = {
  tap: { wave: 'triangle', gain: 0.22, notes: [[520, 0, 0.06]] },
  step: { wave: 'sine', gain: 0.3, notes: [[300, 0, 0.07], [420, 0.05, 0.09]] },
  jump: { wave: 'sine', gain: 0.32, notes: [[260, 0, 0.08], [390, 0.07, 0.09], [620, 0.14, 0.12]] },
  deny: { wave: 'square', gain: 0.1, notes: [[180, 0, 0.09], [150, 0.09, 0.12]] },
  undo: { wave: 'triangle', gain: 0.22, notes: [[440, 0, 0.07], [330, 0.07, 0.1]] },
  hint: { wave: 'sine', gain: 0.22, notes: [[660, 0, 0.1], [880, 0.1, 0.16]] },
  stuck: { wave: 'sawtooth', gain: 0.1, notes: [[220, 0, 0.16], [196, 0.16, 0.16], [165, 0.32, 0.28]] },
  win: { wave: 'triangle', gain: 0.3, notes: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.3]] },
  star: { wave: 'sine', gain: 0.22, notes: [[880, 0, 0.12], [1175, 0.08, 0.2]] },
  open: { wave: 'triangle', gain: 0.18, notes: [[392, 0, 0.07], [494, 0.06, 0.09]] },
  close: { wave: 'triangle', gain: 0.18, notes: [[494, 0, 0.07], [392, 0.06, 0.09]] },
};
