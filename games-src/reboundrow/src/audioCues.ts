// Cue table: [frequency Hz, start s, duration s] notes per cue. All synthesised.
export type Sfx =
  | 'launch' | 'wall' | 'paddle' | 'hit' | 'break' | 'steel' | 'catch' | 'laser'
  | 'lost' | 'life' | 'clear' | 'over' | 'click' | 'multi';

export interface Cue { wave: OscillatorType; gain: number; notes: readonly (readonly [number, number, number])[] }

export const CUES: Readonly<Record<Sfx, Cue>> = {
  launch: { wave: 'triangle', gain: 0.25, notes: [[330, 0, 0.08], [495, 0.06, 0.1]] },
  wall: { wave: 'sine', gain: 0.18, notes: [[240, 0, 0.05]] },
  paddle: { wave: 'triangle', gain: 0.3, notes: [[180, 0, 0.09]] },
  hit: { wave: 'square', gain: 0.1, notes: [[520, 0, 0.05]] },
  break: { wave: 'square', gain: 0.12, notes: [[620, 0, 0.05], [830, 0.04, 0.07]] },
  steel: { wave: 'sawtooth', gain: 0.08, notes: [[150, 0, 0.07], [110, 0.03, 0.08]] },
  catch: { wave: 'triangle', gain: 0.25, notes: [[440, 0, 0.07], [660, 0.06, 0.07], [880, 0.12, 0.1]] },
  multi: { wave: 'triangle', gain: 0.25, notes: [[523, 0, 0.06], [659, 0.05, 0.06], [784, 0.1, 0.06], [1046, 0.15, 0.12]] },
  laser: { wave: 'sawtooth', gain: 0.07, notes: [[900, 0, 0.05], [600, 0.03, 0.05]] },
  lost: { wave: 'sawtooth', gain: 0.2, notes: [[300, 0, 0.14], [220, 0.12, 0.14], [150, 0.24, 0.3]] },
  life: { wave: 'triangle', gain: 0.25, notes: [[587, 0, 0.08], [880, 0.08, 0.14]] },
  clear: { wave: 'triangle', gain: 0.28, notes: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1046, 0.36, 0.3]] },
  over: { wave: 'sawtooth', gain: 0.2, notes: [[260, 0, 0.2], [196, 0.2, 0.2], [130, 0.4, 0.45]] },
  click: { wave: 'sine', gain: 0.15, notes: [[600, 0, 0.04]] },
};
