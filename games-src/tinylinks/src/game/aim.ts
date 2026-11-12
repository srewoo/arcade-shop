import { CONFIG } from '../config';

export interface Aim { angle: number; power: number }

const TAU = Math.PI * 2;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
export const normAngle = (a: number): number => ((a % TAU) + TAU) % TAU;

/**
 * Drag-back aiming. (wx, wy) is the drag vector in WORLD orientation; `screenLen` is its
 * length in screen pixels (so power feels the same at any zoom). Pulling back shoots the
 * other way. Returns null inside the dead zone (release there to cancel).
 */
export function aimFromDrag(wx: number, wy: number, screenLen: number): Aim | null {
  const { deadzone, dragFull } = CONFIG.aim;
  if (screenLen < deadzone || (wx === 0 && wy === 0)) return null;
  return { angle: normAngle(Math.atan2(-wy, -wx)), power: clamp01((screenLen - deadzone) / (dragFull - deadzone)) };
}

export const nudgeAngle = (a: Aim, dir: -1 | 1, fine: boolean): Aim => ({
  angle: normAngle(a.angle + dir * (fine ? CONFIG.aim.keyAngleFine : CONFIG.aim.keyAngleStep)), power: a.power,
});

export const nudgePower = (a: Aim, dir: -1 | 1, fine: boolean): Aim => ({
  angle: a.angle, power: clamp01(Math.round((a.power + dir * (fine ? CONFIG.aim.keyPowerFine : CONFIG.aim.keyPowerStep)) * 100) / 100),
});

/** Direction from `from` towards `to`, as the default aim for a new stroke. */
export const aimAt = (from: { x: number; y: number }, to: { x: number; y: number }, power: number = CONFIG.aim.defaultPower): Aim => ({
  angle: normAngle(Math.atan2(to.y - from.y, to.x - from.x)), power,
});
