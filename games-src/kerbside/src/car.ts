// Bicycle-model car with an optional single-axle trailer. Pure, fixed-step.
import { CONFIG } from './config';
import type { Box } from './geom';
import { wrapAngle } from './geom';

export interface Controls {
  /** +1 forward pedal, -1 reverse pedal, 0 coast. */
  readonly throttle: number;
  readonly brake: boolean;
  /** Wheel target, -1 (left) .. +1 (right). */
  readonly steer: number;
}
export const NO_CONTROLS: Controls = Object.freeze({ throttle: 0, brake: false, steer: 0 });

export interface CarState {
  /** Rear-axle position, heading, signed speed (m/s), front-wheel angle (rad). */
  readonly x: number;
  readonly y: number;
  readonly a: number;
  readonly v: number;
  readonly steer: number;
  /** Trailer heading (only meaningful when the level has a trailer). */
  readonly phi: number;
}

const C = CONFIG.car;
const T = CONFIG.trailer;

export function makeCar(x: number, y: number, a: number): CarState {
  return { x, y, a, v: 0, steer: 0, phi: a };
}

const approach = (value: number, target: number, maxDelta: number): number =>
  Math.abs(target - value) <= maxDelta ? target : value + Math.sign(target - value) * maxDelta;

/** Longitudinal speed update from pedals, brake, rolling resistance and drag. */
export function nextSpeed(v: number, c: Controls, dt: number, trailer: boolean): number {
  const top = trailer ? T.maxForward : C.maxForward;
  const rev = trailer ? T.maxReverse : C.maxReverse;
  let next = v;
  if (c.throttle > 0) next = v < 0 ? approach(v, 0, C.brake * dt) : Math.min(top, v + C.accel * c.throttle * dt);
  else if (c.throttle < 0) next = v > 0 ? approach(v, 0, C.brake * dt) : Math.max(-rev, v + C.reverseAccel * c.throttle * dt);
  if (c.brake) return approach(next, 0, C.handbrake * dt);
  const resist = (C.rolling + C.drag * Math.abs(next)) * dt * (c.throttle === 0 ? 1 : 0.15);
  return approach(next, 0, resist);
}

export function nextSteer(steer: number, target: number, dt: number): number {
  const goal = target * C.maxSteer;
  const rate = Math.abs(goal) < Math.abs(steer) ? C.centreRate : C.steerRate;
  return approach(steer, goal, rate * dt);
}

/** Advance the car one step (no collision handling). */
export function integrate(s: CarState, c: Controls, dt: number, trailer: boolean): CarState {
  const v = nextSpeed(s.v, c, dt, trailer);
  const steer = nextSteer(s.steer, c.steer, dt);
  const vMid = (s.v + v) / 2;
  const yaw = (vMid / C.wheelbase) * Math.tan(steer);
  const a = wrapAngle(s.a + yaw * dt);
  const aMid = s.a + (yaw * dt) / 2;
  const x = s.x + vMid * Math.cos(aMid) * dt;
  const y = s.y + vMid * Math.sin(aMid) * dt;
  const phi = trailer ? nextTrailerAngle(s, vMid, yaw, dt) : a;
  return { x, y, a, v, steer, phi: wrapAngle(phi) };
}

/** Single-axle trailer with the hitch behind the car's rear axle. */
export function nextTrailerAngle(s: CarState, v: number, yaw: number, dt: number): number {
  const rel = s.a - s.phi;
  const rate = (v * Math.sin(rel) - T.hitchBehindAxle * yaw * Math.cos(rel)) / T.drawbar;
  return s.phi + rate * dt;
}

export function carBox(s: CarState): Box {
  return {
    x: s.x + Math.cos(s.a) * C.centreOffset,
    y: s.y + Math.sin(s.a) * C.centreOffset,
    hw: C.length / 2,
    hh: C.width / 2,
    a: s.a,
  };
}

export function hitchPoint(s: CarState): { x: number; y: number } {
  return { x: s.x - Math.cos(s.a) * T.hitchBehindAxle, y: s.y - Math.sin(s.a) * T.hitchBehindAxle };
}

export function trailerBox(s: CarState): Box {
  const h = hitchPoint(s);
  return {
    x: h.x - Math.cos(s.phi) * T.drawbar,
    y: h.y - Math.sin(s.phi) * T.drawbar,
    hw: T.length / 2,
    hh: T.width / 2,
    a: s.phi,
  };
}

export const isJackknifed = (s: CarState): boolean => Math.abs(wrapAngle(s.a - s.phi)) > T.jackknife;
