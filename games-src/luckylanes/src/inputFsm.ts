// Shot-entry state machine: position -> aim -> power -> spin -> rolling.
// Pure: time is fed in through tick(), nothing touches the DOM.
import { MAX_AIM, START_X_LIMIT } from './constants';
import { aimFromBar, aimToBar, spinFromBar, spinToBar } from './meterMap';
import { clamp } from './rng';
import { TUNING } from './tuning';
import type { Shot } from './worldTypes';

export type Phase = 'position' | 'aim' | 'power' | 'spin' | 'rolling';

export interface InputState {
  readonly phase: Phase;
  /** Seconds spent in the current meter phase. */
  readonly t: number;
  readonly startX: number;
  readonly aim: number;
  readonly power: number;
  readonly spin: number;
  /** Bar positions (-1..1) shown on the meters; aim and spin are mapped from these. */
  readonly aimU: number;
  readonly spinU: number;
  /** Wide-pocket assist: flatter meter curves. */
  readonly assist: boolean;
  /** Per-turn phase offsets (cycles) so mashing Space does not give a centred shot. */
  readonly offsets: Offsets;
}

export interface Offsets {
  readonly aim: number;
  readonly power: number;
  readonly spin: number;
}

export interface InputOptions {
  readonly assist?: boolean;
  readonly offsets?: Offsets;
}

export const NO_OFFSETS: Offsets = { aim: 0, power: 0, spin: 0 };

export const AIM_HZ = TUNING.meters.aimHz;
export const POWER_HZ = TUNING.meters.powerHz;
export const SPIN_HZ = TUNING.meters.spinHz;
const ORDER: readonly Phase[] = ['position', 'aim', 'power', 'spin', 'rolling'];

/** Triangle wave in [-1, 1]: starts at 0, peaks at 1 after a quarter cycle. */
export function triangle(cycles: number): number {
  const p = cycles - Math.floor(cycles);
  if (p < 0.25) return 4 * p;
  if (p < 0.75) return 2 - 4 * p;
  return 4 * p - 4;
}

export const createInput = (startX = 0, opts: InputOptions = {}): InputState => ({
  phase: 'position', t: 0, startX: clamp(startX, -START_X_LIMIT, START_X_LIMIT), aim: 0, power: 0.5, spin: 0,
  aimU: 0, spinU: 0, assist: opts.assist ?? false, offsets: opts.offsets ?? NO_OFFSETS,
});

export function moveStart(s: InputState, dx: number): InputState {
  if (s.phase !== 'position') return s;
  return { ...s, startX: clamp(s.startX + dx, -START_X_LIMIT, START_X_LIMIT) };
}

export function setStart(s: InputState, x: number): InputState {
  return s.phase === 'position' ? { ...s, startX: clamp(x, -START_X_LIMIT, START_X_LIMIT) } : s;
}

export function tick(s: InputState, dt: number): InputState {
  const t = s.t + Math.max(0, dt);
  switch (s.phase) {
    case 'aim': { const aimU = triangle(t * AIM_HZ + s.offsets.aim); return { ...s, t, aimU, aim: aimFromBar(aimU, s.assist) }; }
    case 'power': return { ...s, t, power: 0.5 + 0.5 * triangle(t * POWER_HZ + s.offsets.power) };
    case 'spin': { const spinU = triangle(t * SPIN_HZ + s.offsets.spin); return { ...s, t, spinU, spin: spinFromBar(spinU, s.assist) }; }
    default: return s;
  }
}

/** Lock the current meter and advance to the next phase. */
export function confirm(s: InputState): InputState {
  const next = ORDER[ORDER.indexOf(s.phase) + 1];
  return next ? tick({ ...s, phase: next, t: 0 }, 0) : s;
}

/** Step back one meter (not possible once the ball is rolling). */
export function back(s: InputState): InputState {
  const i = ORDER.indexOf(s.phase);
  if (i <= 0 || s.phase === 'rolling') return s;
  return tick({ ...s, phase: ORDER[i - 1] as Phase, t: 0 }, 0);
}

export const isRolling = (s: InputState): boolean => s.phase === 'rolling';

/** Skip the meters and throw with explicit values (drag-to-throw, CPU). */
export function throwWith(s: InputState, shot: Omit<Shot, 'x'>): InputState {
  const aim = clamp(shot.aim, -MAX_AIM, MAX_AIM);
  const spin = clamp(shot.spin, -1, 1);
  return {
    ...s, phase: 'rolling', t: 0, aim, power: clamp(shot.power, 0, 1), spin,
    aimU: aimToBar(aim, s.assist), spinU: spinToBar(spin, s.assist),
  };
}

export const shotOf = (s: InputState): Shot => ({ x: s.startX, aim: s.aim, power: s.power, spin: s.spin });
