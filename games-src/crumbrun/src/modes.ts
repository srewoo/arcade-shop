// Timers: chase/groom breathing rhythm and the drench window.
import { TUNING } from './config/tuning';

export const CHASE_SEC = TUNING.rhythm.chaseSec;
/** The "rest" phase: active cats stop where they are and groom. */
export const REST_SEC = TUNING.rhythm.groomSec;
export const BLINK_SEC = TUNING.drench.blinkSec;

export type Phase = 'chase' | 'rest';
export interface ModeClock {
  phase: Phase;
  left: number;
}

export function newClock(): ModeClock {
  return { phase: 'chase', left: CHASE_SEC };
}

/** Advance the clock; returns true if the phase flipped this tick. */
export function tickClock(c: ModeClock, dt: number): boolean {
  c.left -= dt;
  if (c.left > 0) return false;
  c.phase = c.phase === 'chase' ? 'rest' : 'chase';
  c.left += c.phase === 'chase' ? CHASE_SEC : REST_SEC;
  return true;
}

export interface Drench {
  left: number;
  chain: number;
}

export function newDrench(): Drench {
  return { left: 0, chain: 0 };
}

export function startDrench(d: Drench, seconds: number): void {
  d.left = seconds;
  d.chain = 0;
}

export function tickDrench(d: Drench, dt: number): boolean {
  if (d.left <= 0) return false;
  d.left = Math.max(0, d.left - dt);
  return d.left === 0;
}

export function drenchActive(d: Drench): boolean {
  return d.left > 0;
}

/** True while the blue tint should flicker to warn that it is wearing off. */
export function drenchBlinking(d: Drench): boolean {
  return d.left > 0 && d.left < BLINK_SEC && Math.floor(d.left * 8) % 2 === 0;
}
