// Pure maths for the shot meters: the bar position u in [-1, 1] maps to a
// shot value through a power curve, so the centre of the bar is a wide,
// slow target. Time and DOM never appear here.
import { MAX_AIM } from './constants';
import { TUNING } from './tuning';

const signedPow = (u: number, exp: number): number => Math.sign(u) * Math.abs(u) ** exp;

export const aimExp = (assist: boolean): number => (assist ? TUNING.meters.aimExpAssist : TUNING.meters.aimExp);
export const spinExp = (assist: boolean): number => (assist ? TUNING.meters.spinExpAssist : TUNING.meters.spinExp);

/** Aim angle (rad) for a bar position. */
export const aimFromBar = (u: number, assist = false): number => MAX_AIM * signedPow(Math.max(-1, Math.min(1, u)), aimExp(assist));

/** Hook strength (-1..1) for a bar position. */
export const spinFromBar = (u: number, assist = false): number => signedPow(Math.max(-1, Math.min(1, u)), spinExp(assist));

/** Half-width of the bar (0..1) whose aim stays inside the strike band. */
export const perfectZoneU = (assist = false): number => (TUNING.meters.strikeBandRad / MAX_AIM) ** (1 / aimExp(assist));

/** Seconds the aim bar spends inside the strike band on one pass through the centre. */
export function strikeWindowSeconds(assist = false, hz: number = TUNING.meters.aimHz): number {
  return (2 * perfectZoneU(assist)) / (4 * hz);
}

export type PocketCall = 'pocket' | 'nice' | null;

/** Judge where a first ball crosses the head-pin line: "Pocket!" on target, "Nice!" when close. */
export function pocketCall(headX: number): PocketCall {
  const off = Math.abs(Math.abs(headX) - TUNING.meters.pocketX);
  if (off <= TUNING.meters.pocketWindowCm) return 'pocket';
  return off <= TUNING.meters.pocketWindowCm * 2 ? 'nice' : null;
}

/** Inverse of `aimFromBar`: the bar position that produces this aim. */
export const aimToBar = (aim: number, assist = false): number => signedPow(Math.max(-1, Math.min(1, aim / MAX_AIM)), 1 / aimExp(assist));

/** Inverse of `spinFromBar`. */
export const spinToBar = (spin: number, assist = false): number => signedPow(Math.max(-1, Math.min(1, spin)), 1 / spinExp(assist));
