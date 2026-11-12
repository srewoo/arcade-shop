// Pseudo-perspective camera. Depth is compressed (K < 1) so the far pins stay
// readable on a phone-sized lane; behind the rack break it opens up (kRack) so
// the three front rows separate. Pure math, no DOM.
import { HEAD_Y } from './constants';
import { TUNING } from './tuning';

const { d0: D0, k: K, kRack: K_RACK, rackBreakBack, heightBoost, rackLift, rackLiftCap } = TUNING.camera;
const MIN_DEPTH = 30;
export const BREAK_Y = HEAD_Y - rackBreakBack;
const FOUL_FRAC = 0.86;

export interface Camera {
  /** World y of the camera on the lane axis. */
  y: number;
  /** World x of the camera (follows the ball a little). */
  x: number;
  /** Focal length in px. */
  f: number;
  /** Screen x of the vanishing point. */
  cx: number;
  /** Screen y of the horizon. */
  horizon: number;
  /** Camera height in cm. */
  h: number;
}

export interface Projected {
  readonly sx: number;
  readonly sy: number;
  /** px per cm at that depth. */
  readonly s: number;
}

export function createCamera(width: number, height: number): Camera {
  const f = 2.2 * Math.min(width, height * 0.62);
  const sFoul = f / (D0 + K * 170);
  const h = (0.68 * height * heightBoost) / sFoul;
  // The foul line stays at the same screen height; a higher camera lifts the horizon.
  return { y: -170, x: 0, f, cx: width / 2, horizon: height * FOUL_FRAC - h * sFoul, h };
}

/** Eye-to-point depth in cm along the lane. */
export const depthAt = (camY: number, y: number): number => Math.max(MIN_DEPTH, D0 + K * (Math.min(y, BREAK_Y) - camY) + K_RACK * Math.max(0, y - BREAK_Y));

export function project(cam: Camera, x: number, y: number, z = 0): Projected {
  const s = cam.f / depthAt(cam.y, y);
  const lift = rackLift * s * Math.min(Math.max(0, y - BREAK_Y), rackLiftCap);
  return { sx: cam.cx + (x - cam.x) * s, sy: cam.horizon + (cam.h - z) * s - lift, s };
}

/** True if a world y is in front of the camera. */
export const visibleY = (cam: Camera, y: number): boolean => y >= cam.y - 20;

/** Camera y target for a given phase of play. */
export function followTarget(ballY: number, rolling: boolean, pinsY: number): number {
  if (!rolling) return -170;
  return Math.min(pinsY - 560, Math.max(-170, ballY - 300));
}

export const approach = (current: number, target: number, rate: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-rate * dt));
