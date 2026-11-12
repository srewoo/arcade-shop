// Player movement: steering, throttle, fuel and timers.
import { CONFIG } from './config';
import { topSpeed } from './scoring';
import type { Input, Sim } from './simTypes';

const P = CONFIG.player;
const SP = CONFIG.speed;

const approach = (v: number, target: number, delta: number): number =>
  v < target ? Math.min(target, v + delta) : Math.max(target, v - delta);

function steer(s: Sim, dir: number, dt: number): void {
  s.vx = approach(s.vx, dir * P.steerMax, P.steerAccel * dt);
  s.x += s.vx * dt;
  const lo = P.halfW + P.edgePad;
  const hi = CONFIG.lanes - lo;
  if (s.x < lo || s.x > hi) {
    s.x = Math.max(lo, Math.min(hi, s.x));
    s.vx = 0;
  }
}

function throttle(s: Sim, input: Input, dt: number): void {
  const boosted = s.boost > 0;
  const top = topSpeed(s.z) + (boosted ? SP.boostAdd : 0);
  const prev = s.speed;
  if (input.brake) s.speed -= P.brake * dt;
  else if (input.gas) s.speed += P.accel * (boosted ? SP.boostAccelMul : 1) * dt;
  else s.speed = approach(s.speed, top, P.autoAccel * dt);
  if (s.speed > top) s.speed = prev > top ? Math.max(top, Math.min(s.speed, prev) - P.overspeedDecay * dt) : top;
  s.speed = Math.max(P.minSpeed, s.speed);
}

/** Advance the player one step; returns the distance covered. */
export function stepPlayer(s: Sim, input: Input, dt: number, fuelOn: boolean): number {
  steer(s, input.steer, dt);
  throttle(s, input, dt);
  const dz = s.speed * dt;
  s.z += dz;
  if (fuelOn) s.fuel = Math.max(0, s.fuel - (CONFIG.fuel.drainBase + s.speed * CONFIG.fuel.drainPerSpeed) * dt);
  s.boost = Math.max(0, s.boost - dt);
  s.invuln = Math.max(0, s.invuln - dt);
  if (s.comboT > 0) {
    s.comboT -= dt;
    if (s.comboT <= 0) s.combo = 0;
  }
  return dz;
}
