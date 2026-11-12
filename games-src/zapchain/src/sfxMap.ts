// Maps simulation events to sound cues (pure, so it is testable without WebAudio).
import { SPAWN_STEPS, type CueOpts, type Sfx } from './audioCues';
import type { SimEvent } from './model/types';

export interface CueCall { readonly name: Sfx; readonly opts?: CueOpts }

/** Semitones to lift a zap cue: bigger chains ring higher, capped at an octave. */
export const zapStep = (n: number): number => Math.max(0, Math.min(12, n - 2));

export function cueFor(e: SimEvent): CueCall | null {
  switch (e.t) {
    case 'zap': return { name: 'zap', opts: { step: zapStep(e.n) } };
    case 'bomb': return { name: 'bomb' };
    case 'invalid': return { name: 'invalid' };
    case 'spawn': return { name: 'spawn', opts: { step: SPAWN_STEPS[Math.min(SPAWN_STEPS.length - 1, Math.floor(e.col / 2))] ?? 0 } };
    case 'land': return e.speed > 9 ? { name: 'land' } : null;
    case 'warn': return { name: 'warn' };
    case 'wipe': return { name: 'wipe' };
    case 'cleared': return { name: 'cleared' };
    case 'over': return { name: 'over' };
    default: return null;
  }
}
