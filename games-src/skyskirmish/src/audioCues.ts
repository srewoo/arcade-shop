// Sound effect recipes. [freq Hz, start s, duration s, optional end freq Hz for a slide].
export type Sfx = 'shot' | 'hit' | 'boom' | 'bigBoom' | 'pickup' | 'bomb' | 'hurt' | 'shield' | 'multUp' | 'wave' | 'boss' | 'win' | 'lose' | 'click';

export interface Cue {
  wave: OscillatorType;
  gain: number;
  notes: readonly (readonly [number, number, number, number?])[];
  /** Optional filtered-noise burst: [duration s, lowpass Hz]. */
  noise?: readonly [number, number];
}

export const CUES: Readonly<Record<Sfx, Cue>> = {
  shot: { wave: 'square', gain: 0.05, notes: [[880, 0, 0.05, 440]] },
  hit: { wave: 'triangle', gain: 0.07, notes: [[300, 0, 0.04, 200]] },
  boom: { wave: 'sawtooth', gain: 0.12, notes: [[160, 0, 0.18, 50]], noise: [0.18, 1400] },
  bigBoom: { wave: 'sawtooth', gain: 0.2, notes: [[120, 0, 0.5, 35]], noise: [0.55, 900] },
  pickup: { wave: 'triangle', gain: 0.14, notes: [[660, 0, 0.07], [880, 0.07, 0.07], [1320, 0.14, 0.12]] },
  bomb: { wave: 'sawtooth', gain: 0.22, notes: [[90, 0, 0.8, 30]], noise: [0.8, 700] },
  hurt: { wave: 'sawtooth', gain: 0.2, notes: [[220, 0, 0.35, 70]], noise: [0.3, 1800] },
  shield: { wave: 'sine', gain: 0.16, notes: [[1200, 0, 0.12, 400]] },
  multUp: { wave: 'triangle', gain: 0.12, notes: [[523, 0, 0.06], [784, 0.06, 0.1]] },
  wave: { wave: 'triangle', gain: 0.13, notes: [[392, 0, 0.1], [523, 0.1, 0.1], [659, 0.2, 0.16]] },
  boss: { wave: 'square', gain: 0.14, notes: [[110, 0, 0.25], [104, 0.3, 0.25], [110, 0.6, 0.4]] },
  win: { wave: 'triangle', gain: 0.16, notes: [[523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14], [1047, 0.42, 0.4]] },
  lose: { wave: 'triangle', gain: 0.16, notes: [[392, 0, 0.2], [330, 0.2, 0.2], [262, 0.4, 0.2], [196, 0.6, 0.5]] },
  click: { wave: 'square', gain: 0.06, notes: [[600, 0, 0.04]] },
};
