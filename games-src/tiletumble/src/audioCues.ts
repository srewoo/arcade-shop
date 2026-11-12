// Cue definitions: [frequency Hz, start s, duration s] per note.
export type Sfx = 'tick' | 'clear' | 'bigClear' | 'invalid' | 'undo' | 'rise' | 'win' | 'lose' | 'bonus' | 'ui';
interface Cue {
  readonly wave: OscillatorType;
  readonly gain: number;
  readonly notes: readonly (readonly [number, number, number])[];
}
export const CUES: Readonly<Record<Sfx, Cue>> = {
  tick: { wave: 'sine', gain: 0.05, notes: [[880, 0, 0.04]] },
  ui: { wave: 'triangle', gain: 0.12, notes: [[520, 0, 0.07]] },
  clear: { wave: 'triangle', gain: 0.2, notes: [[392, 0, 0.1], [523, 0.07, 0.14]] },
  bigClear: { wave: 'triangle', gain: 0.22, notes: [[392, 0, 0.1], [523, 0.07, 0.1], [659, 0.14, 0.1], [784, 0.21, 0.22]] },
  invalid: { wave: 'square', gain: 0.07, notes: [[150, 0, 0.12]] },
  undo: { wave: 'sine', gain: 0.16, notes: [[523, 0, 0.08], [392, 0.07, 0.12]] },
  rise: { wave: 'sine', gain: 0.12, notes: [[196, 0, 0.12], [247, 0.08, 0.14]] },
  bonus: { wave: 'sine', gain: 0.2, notes: [[659, 0, 0.1], [784, 0.08, 0.1], [988, 0.16, 0.1], [1319, 0.24, 0.3]] },
  win: { wave: 'triangle', gain: 0.22, notes: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.4]] },
  lose: { wave: 'sawtooth', gain: 0.1, notes: [[330, 0, 0.18], [262, 0.16, 0.18], [196, 0.32, 0.4]] },
};
