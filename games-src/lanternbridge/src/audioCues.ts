// Cue recipes for the synthesised sound effects. Times in seconds, freq in Hz.
export type Sfx = 'select' | 'deselect' | 'cross' | 'clink' | 'error' | 'undo' | 'hint' | 'win' | 'star' | 'lose' | 'click' | 'pause';

export interface Tone {
  readonly t: number;
  readonly f: number;
  readonly d: number;
  readonly type: OscillatorType;
  readonly g: number;
  /** Optional end frequency for a slide. */
  readonly to?: number;
}

const step = (t: number, f: number, d = 0.09, g = 0.5, type: OscillatorType = 'triangle'): Tone => ({ t, f, d, type, g });

export const CUES: Record<Sfx, readonly Tone[]> = {
  select: [step(0, 660, 0.07, 0.4)],
  deselect: [step(0, 440, 0.07, 0.35)],
  click: [step(0, 520, 0.05, 0.3, 'square')],
  pause: [step(0, 392, 0.08, 0.35), step(0.07, 294, 0.1, 0.35)],
  cross: [step(0, 196, 0.06, 0.5), step(0.18, 208, 0.06, 0.5), step(0.36, 196, 0.06, 0.5), step(0.54, 220, 0.06, 0.5)],
  clink: [step(0, 1320, 0.18, 0.35, 'sine'), step(0.04, 1760, 0.22, 0.25, 'sine')],
  error: [{ t: 0, f: 180, d: 0.22, type: 'sawtooth', g: 0.35, to: 110 }],
  undo: [{ t: 0, f: 520, d: 0.14, type: 'triangle', g: 0.4, to: 330 }],
  hint: [step(0, 880, 0.1, 0.35, 'sine'), step(0.11, 1175, 0.14, 0.35, 'sine')],
  star: [step(0, 1046, 0.14, 0.4, 'sine')],
  win: [step(0, 523, 0.14), step(0.14, 659, 0.14), step(0.28, 784, 0.14), step(0.42, 1046, 0.34)],
  lose: [{ t: 0, f: 392, d: 0.5, type: 'sawtooth', g: 0.3, to: 130 }],
};
