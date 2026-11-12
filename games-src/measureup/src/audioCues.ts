// Cue table: [frequency Hz, start s, duration s] notes per sound effect.
export type Sfx = 'select' | 'fill' | 'empty' | 'pour' | 'invalid' | 'undo' | 'hint' | 'win' | 'star' | 'pause' | 'click';

export interface Cue {
  readonly wave: OscillatorType;
  readonly gain: number;
  readonly notes: readonly (readonly [number, number, number])[];
}

export const CUES: Readonly<Record<Sfx, Cue>> = {
  select: { wave: 'sine', gain: 0.18, notes: [[520, 0, 0.07]] },
  click: { wave: 'sine', gain: 0.14, notes: [[400, 0, 0.05]] },
  fill: { wave: 'sine', gain: 0.2, notes: [[260, 0, 0.12], [330, 0.08, 0.12], [420, 0.16, 0.16]] },
  empty: { wave: 'sine', gain: 0.2, notes: [[420, 0, 0.1], [330, 0.08, 0.1], [240, 0.16, 0.16]] },
  pour: { wave: 'triangle', gain: 0.2, notes: [[360, 0, 0.09], [300, 0.07, 0.09], [380, 0.14, 0.09], [320, 0.21, 0.12]] },
  invalid: { wave: 'square', gain: 0.07, notes: [[150, 0, 0.14]] },
  undo: { wave: 'triangle', gain: 0.16, notes: [[440, 0, 0.06], [330, 0.06, 0.1]] },
  hint: { wave: 'sine', gain: 0.18, notes: [[660, 0, 0.08], [880, 0.09, 0.14]] },
  star: { wave: 'sine', gain: 0.2, notes: [[880, 0, 0.18]] },
  pause: { wave: 'sine', gain: 0.14, notes: [[300, 0, 0.1]] },
  win: {
    wave: 'triangle',
    gain: 0.22,
    notes: [[392, 0, 0.16], [494, 0.14, 0.16], [587, 0.28, 0.16], [784, 0.42, 0.34]],
  },
};
