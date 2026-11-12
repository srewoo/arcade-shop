// Circle collision resolution: ball-pin and pin-pin (2D top-down).
import {
  BALL_MASS, BALL_PIN_RESTITUTION, BALL_R, CONTACT_FRICTION, FALL_SPEED, PIN_MASS, PIN_PIN_RESTITUTION, PIN_R,
} from './constants';
import type { Pin, World } from './worldTypes';

const EPS = 1e-4;
const FALLEN_EXTRA_R = 6.5;

/** A toppled pin lies on its side and sweeps a wider arc than a standing one. */
export const pinRadius = (pin: Pin): number =>
  pin.state === 'falling' ? PIN_R + FALLEN_EXTRA_R * Math.min(1, pin.fallT / 0.12) : PIN_R;

/** Apply a normal+friction impulse between bodies A (index a) and B. Returns normal impulse. */
function impulse(
  va: { vx: number; vy: number }, vb: { vx: number; vy: number },
  nx: number, ny: number, ma: number, mb: number, restitution: number,
): { j: number; dva: number; dvb: number } {
  const rvx = vb.vx - va.vx;
  const rvy = vb.vy - va.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return { j: 0, dva: 0, dvb: 0 };
  const inv = 1 / ma + 1 / mb;
  const j = (-(1 + restitution) * vn) / inv;
  va.vx -= (j * nx) / ma;
  va.vy -= (j * ny) / ma;
  vb.vx += (j * nx) / mb;
  vb.vy += (j * ny) / mb;
  // Coulomb friction along the tangent, capped by mu * j.
  const tx = -ny;
  const ty = nx;
  const vt = (vb.vx - va.vx) * tx + (vb.vy - va.vy) * ty;
  const jt = Math.max(-CONTACT_FRICTION * j, Math.min(CONTACT_FRICTION * j, -vt / inv));
  va.vx -= (jt * tx) / ma;
  va.vy -= (jt * ty) / ma;
  vb.vx += (jt * tx) / mb;
  vb.vy += (jt * ty) / mb;
  return { j, dva: j / ma, dvb: j / mb };
}

/** Register a hit on a pin: build stress and topple it past the threshold. */
function hitPin(world: World, pin: Pin, dv: number, dirX: number, dirY: number): void {
  if (pin.state !== 'standing') return;
  pin.stress += dv;
  if (dv > FALL_SPEED || pin.stress > FALL_SPEED * 1.25) {
    pin.state = 'falling';
    pin.fallT = 0;
    const sp = Math.hypot(pin.vx, pin.vy);
    pin.fallDx = sp > 1 ? pin.vx / sp : dirX;
    pin.fallDy = sp > 1 ? pin.vy / sp : dirY;
    world.events.push({ kind: 'pinFall', x: pin.x, y: pin.y, strength: sp });
  }
}

export function collideBallPins(world: World): void {
  const ball = world.ball;
  if (!ball.active || ball.inGutter) return;
  for (const pin of world.pins) {
    if (pin.state === 'down') continue;
    const reach = BALL_R + pinRadius(pin);
    const dx = pin.x - ball.x;
    const dy = pin.y - ball.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= reach * reach) continue;
    const d = Math.sqrt(d2);
    const nx = d > EPS ? dx / d : 0;
    const ny = d > EPS ? dy / d : 1;
    pin.x += nx * (reach - d + EPS);
    pin.y += ny * (reach - d + EPS);
    const r = impulse(ball, pin, nx, ny, BALL_MASS, PIN_MASS, BALL_PIN_RESTITUTION);
    if (r.j <= 0) continue;
    world.events.push({ kind: 'ballPin', x: pin.x, y: pin.y, strength: r.j });
    hitPin(world, pin, r.dvb, nx, ny);
  }
}

export function collidePinPins(world: World): void {
  const pins = world.pins;
  for (let i = 0; i < pins.length; i++) {
    const a = pins[i] as Pin;
    if (a.state === 'down') continue;
    for (let k = i + 1; k < pins.length; k++) {
      const b = pins[k] as Pin;
      if (b.state === 'down') continue;
      const reach = pinRadius(a) + pinRadius(b);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= reach * reach) continue;
      const d = Math.sqrt(d2);
      const nx = d > EPS ? dx / d : 1;
      const ny = d > EPS ? dy / d : 0;
      const push = (reach - d) / 2 + EPS;
      a.x -= nx * push; a.y -= ny * push;
      b.x += nx * push; b.y += ny * push;
      const r = impulse(a, b, nx, ny, PIN_MASS, PIN_MASS, PIN_PIN_RESTITUTION);
      if (r.j <= 0) continue;
      if (r.dvb > 20) world.events.push({ kind: 'pinPin', x: b.x, y: b.y, strength: r.j });
      hitPin(world, a, r.dva, -nx, -ny);
      hitPin(world, b, r.dvb, nx, ny);
    }
  }
}

/** Position-only relaxation so resting pins never overlap. */
export function separatePins(world: World, iterations = 10): void {
  const pins = world.pins;
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let i = 0; i < pins.length; i++) {
      const a = pins[i] as Pin;
      if (a.state === 'down') continue;
      for (let k = i + 1; k < pins.length; k++) {
        const b = pins[k] as Pin;
        if (b.state === 'down') continue;
        const reach = pinRadius(a) + pinRadius(b);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d >= reach) continue;
        const nx = d > EPS ? dx / d : 1;
        const ny = d > EPS ? dy / d : 0;
        const push = (reach - d) / 2 + EPS;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        moved = true;
      }
    }
    if (!moved) return;
  }
}
