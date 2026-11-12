// Pure sound plans: each game event maps to a list of synth voices (no audio objects here).
import type { SimEvent } from './simTypes';

export interface Voice {
  readonly kind: 'tone' | 'noise';
  readonly freq: number;
  readonly to?: number;
  readonly dur: number;
  readonly vol: number;
  readonly type?: OscillatorType;
  readonly delay?: number;
}

export type UiCue = { type: 'click' } | { type: 'pause' };
export type Cue = SimEvent | UiCue;

export function soundPlan(e: Cue): Voice[] {
  switch (e.type) {
    case 'count': return [{ kind: 'tone', freq: 440, dur: 0.18, vol: 0.25, type: 'square' }];
    case 'go': return [{ kind: 'tone', freq: 880, dur: 0.4, vol: 0.28, type: 'square' }];
    case 'near': {
      const f = 520 + Math.min(e.combo, 8) * 60;
      return [{ kind: 'tone', freq: f, to: f * 1.6, dur: 0.14, vol: 0.22, type: 'triangle' }];
    }
    case 'crash': return [
      { kind: 'noise', freq: 1400, dur: 0.45, vol: 0.5 },
      { kind: 'tone', freq: 160, to: 45, dur: 0.4, vol: 0.4, type: 'sawtooth' },
    ];
    case 'fuel': return [
      { kind: 'tone', freq: 660, dur: 0.1, vol: 0.22, type: 'sine' },
      { kind: 'tone', freq: 880, dur: 0.16, vol: 0.22, type: 'sine', delay: 0.09 },
    ];
    case 'boost': return [{ kind: 'tone', freq: 300, to: 1200, dur: 0.35, vol: 0.25, type: 'sawtooth' }];
    case 'lowfuel': return [0, 0.22].map((delay) => ({ kind: 'tone' as const, freq: 300, dur: 0.12, vol: 0.25, type: 'square' as const, delay }));
    case 'checkpoint': return [
      { kind: 'tone', freq: 587, dur: 0.12, vol: 0.25, type: 'triangle' },
      { kind: 'tone', freq: 784, dur: 0.12, vol: 0.25, type: 'triangle', delay: 0.1 },
      { kind: 'tone', freq: 988, dur: 0.22, vol: 0.25, type: 'triangle', delay: 0.2 },
    ];
    case 'over': return e.outcome === 'finish'
      ? [523, 659, 784, 1047].map((freq, i) => ({ kind: 'tone' as const, freq, dur: 0.22, vol: 0.25, type: 'triangle' as const, delay: i * 0.12 }))
      : [{ kind: 'tone', freq: 330, to: 110, dur: 0.7, vol: 0.3, type: 'sawtooth' }];
    case 'click': return [{ kind: 'tone', freq: 600, dur: 0.05, vol: 0.15, type: 'square' }];
    case 'pause': return [{ kind: 'tone', freq: 400, to: 300, dur: 0.08, vol: 0.15, type: 'square' }];
  }
}

/** Engine pitch and loudness from speed (u/s); loudness is kept low so events stay audible. */
export function enginePlan(speed: number, boosting: boolean): { freq: number; gain: number } {
  return { freq: 55 + speed * 2.6 + (boosting ? 40 : 0), gain: 0.05 + Math.min(speed, 60) / 60 * 0.05 };
}
