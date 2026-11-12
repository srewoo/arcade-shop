import type { CarKind } from './config';
import type { Track } from './track';

export type Mode = 'endless' | 'trial' | 'daily';
export const MODES: readonly Mode[] = ['endless', 'trial', 'daily'];
export type Outcome = 'crash' | 'fuel' | 'time' | 'finish';
export type Phase = 'countdown' | 'run' | 'over';

export interface Input { readonly steer: -1 | 0 | 1; readonly gas: boolean; readonly brake: boolean }
export const NO_INPUT: Input = { steer: 0, gas: false, brake: false };

export interface Car {
  readonly id: number; readonly lane: number; readonly kind: CarKind; readonly len: number;
  readonly hue: number; readonly speed: number;
  z: number; pz: number; minDx: number; scored: boolean;
}
export interface Pickup { readonly id: number; readonly kind: 'fuel' | 'boost'; readonly lane: number; readonly z: number }

export type SimEvent =
  | { type: 'count'; n: number }
  | { type: 'go' }
  | { type: 'near'; combo: number; points: number; x: number }
  | { type: 'crash'; lives: number; x: number; rel: number }
  | { type: 'fuel' }
  | { type: 'boost' }
  | { type: 'lowfuel' }
  | { type: 'checkpoint'; index: number; of: number; bonus: number }
  | { type: 'over'; outcome: Outcome };

export interface Sim {
  readonly mode: Mode;
  readonly seed: number;
  readonly track: Track;
  phase: Phase;
  outcome: Outcome | null;
  countdown: number;
  overT: number;
  runT: number;
  z: number; pz: number; x: number; px: number; vx: number;
  speed: number;
  boost: number;
  invuln: number;
  lives: number;
  fuel: number;
  lowWarned: boolean;
  distScore: number;
  bonus: number;
  combo: number;
  comboT: number;
  maxCombo: number;
  nearMisses: number;
  crashes: number;
  timeLeft: number;
  checkpoint: number;
  nextId: number;
  cars: Car[];
  pickups: Pickup[];
  events: SimEvent[];
}
