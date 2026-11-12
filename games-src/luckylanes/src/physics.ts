// Fixed-step 2D top-down bowling physics. Pure: no DOM, no randomness.
import {
  BALL_MASS, DT, FALLEN_DECEL, FALL_TIME, HEAD_Y, HOOK_ACCEL, HOOK_START_Y, LANE_HALF, MAX_SIM_TIME, MAX_SPEED, MIN_SPEED,
  PIN_COUNT, PIN_MASS, PIN_R, PIN_SLIDE_DECEL, PIT_Y, REST_SPEED, ROLL_DECEL, STRESS_DECAY, GUTTER_WIDTH, BALL_R,
} from './constants';
import { collideBallPins, collidePinPins, separatePins } from './collide';
import { pinSpot, type PinMask } from './pins';
import type { Pin, Shot, SimEvent, World } from './worldTypes';

export const speedForPower = (power: number): number => MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.min(1, Math.max(0, power));

export function createWorld(standing: PinMask, shot: Shot): World {
  const pins: Pin[] = [];
  for (let i = 0; i < PIN_COUNT; i++) {
    const spot = pinSpot(i);
    pins.push({
      index: i, x: spot.x, y: spot.y, vx: 0, vy: 0, state: standing[i] ? 'standing' : 'down',
      stress: 0, fallT: 0, fallDx: 0, fallDy: 1,
    });
  }
  const speed = speedForPower(shot.power);
  return {
    ball: {
      x: shot.x, y: 0, vx: speed * Math.sin(shot.aim), vy: speed * Math.cos(shot.aim),
      spin: shot.spin, active: true, inGutter: false, roll: 0,
    },
    pins,
    time: 0,
    done: false,
    events: [],
    startMask: [...standing],
  };
}

const smooth = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

function stepBall(world: World, dt: number): void {
  const b = world.ball;
  if (!b.active) return;
  if (!b.inGutter) {
    b.vx += b.spin * HOOK_ACCEL * smooth((b.y - HOOK_START_Y) / (HEAD_Y - 250 - HOOK_START_Y)) * dt;
  }
  const speed = Math.hypot(b.vx, b.vy);
  if (speed > 0) {
    const k = Math.max(0, speed - ROLL_DECEL * dt) / speed;
    b.vx *= k;
    b.vy *= k;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.roll += (b.vy * dt) / BALL_R;
  if (!b.inGutter && Math.abs(b.x) > LANE_HALF) {
    b.inGutter = true;
    b.x = Math.sign(b.x) * (LANE_HALF + GUTTER_WIDTH / 2);
    b.vx = 0;
    b.vy *= 0.92;
    b.spin = 0;
    world.events.push({ kind: 'gutter', x: b.x, y: b.y, strength: 1 });
  }
  if (b.y > PIT_Y) {
    b.active = false;
    world.events.push({ kind: 'pit', x: b.x, y: b.y, strength: Math.abs(b.vy) / 1000 });
  }
}

function stepPin(world: World, pin: Pin, dt: number): void {
  if (pin.state === 'down') return;
  const decel = (pin.state === 'falling' ? FALLEN_DECEL : PIN_SLIDE_DECEL) * dt;
  const sp = Math.hypot(pin.vx, pin.vy);
  if (sp > 0) {
    const k = Math.max(0, sp - decel) / sp;
    pin.vx *= k;
    pin.vy *= k;
  }
  pin.x += pin.vx * dt;
  pin.y += pin.vy * dt;
  pin.stress *= Math.exp(-STRESS_DECAY * dt);
  if (pin.state === 'falling') {
    pin.fallT += dt;
    if (pin.fallT >= FALL_TIME && Math.hypot(pin.vx, pin.vy) < REST_SPEED) goDown(pin);
  }
  if (pin.y > PIT_Y || Math.abs(pin.x) > LANE_HALF + PIN_R) goDown(pin, world.events);
}

function goDown(pin: Pin, events?: SimEvent[]): void {
  if (pin.state === 'standing' && events) events.push({ kind: 'pinFall', x: pin.x, y: pin.y, strength: 0 });
  pin.state = 'down';
  pin.vx = 0;
  pin.vy = 0;
}

export function stepWorld(world: World, dt: number = DT): void {
  if (world.done) return;
  world.time += dt;
  stepBall(world, dt);
  collideBallPins(world);
  for (const pin of world.pins) stepPin(world, pin, dt);
  collidePinPins(world);
  separatePins(world);
  if (isSettled(world) || world.time >= MAX_SIM_TIME) finish(world);
}

function isSettled(world: World): boolean {
  if (world.ball.active) return false;
  return world.pins.every((p) => p.state === 'down' || (p.state === 'standing' && Math.hypot(p.vx, p.vy) < REST_SPEED));
}

function finish(world: World): void {
  world.done = true;
  world.ball.active = false;
  for (const p of world.pins) if (p.state === 'falling') goDown(p);
}

/** Run a whole shot to completion; returns the world. Used by the CPU and tests. */
export function simulate(standing: PinMask, shot: Shot, maxSteps = Math.ceil(MAX_SIM_TIME / DT)): World {
  const w = createWorld(standing, shot);
  for (let i = 0; i < maxSteps && !w.done; i++) stepWorld(w);
  finish(w);
  return w;
}

export const standingMask = (w: World): boolean[] => w.pins.map((p) => p.state === 'standing');

/** Pins that were standing at the start of the shot and are no longer standing. */
export const knockedCount = (w: World): number => w.pins.filter((p, i) => w.startMask[i] && p.state !== 'standing').length;

export function kineticEnergy(w: World): number {
  let e = w.ball.active ? 0.5 * BALL_MASS * (w.ball.vx ** 2 + w.ball.vy ** 2) : 0;
  for (const p of w.pins) e += 0.5 * PIN_MASS * (p.vx ** 2 + p.vy ** 2);
  return e;
}

export function drainEvents(w: World): SimEvent[] {
  const out = w.events;
  w.events = [];
  return out;
}
