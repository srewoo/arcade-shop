// Pure simulation for one attempt at a level: movement, collisions, damage, parking, timer.
import type { CarState, Controls } from './car';
import { carBox, integrate, isJackknifed, makeCar, trailerBox } from './car';
import { CONFIG } from './config';
import type { Box } from './geom';
import { angleDiff, containedIn, insideWorld, overlaps } from './geom';
import type { Level } from './levels/types';

export type Status = 'ready' | 'playing' | 'parked' | 'timeout' | 'wrecked';
export type SimEvent = 'start' | 'hit' | 'parked' | 'timeout' | 'wrecked';

export interface SimState {
  readonly car: CarState;
  readonly status: Status;
  readonly time: number;
  readonly damage: number;
  readonly cooldown: number;
  /** 0..1 progress of the park-hold timer. */
  readonly hold: number;
  readonly inBay: boolean;
  readonly events: readonly SimEvent[];
  /** Impact speed of the latest hit (for sound/shake strength). */
  readonly lastImpact: number;
}

export function createSim(level: Level): SimState {
  const { x, y, a } = level.start;
  return { car: makeCar(x, y, a), status: 'ready', time: 0, damage: 0, cooldown: 0, hold: 0, inBay: false, events: [], lastImpact: 0 };
}

/** Bodies of the player's rig, for collision and parking tests. */
export const rigBoxes = (car: CarState, trailer: boolean): Box[] => (trailer ? [carBox(car), trailerBox(car)] : [carBox(car)]);

export function collides(car: CarState, level: Level, grow = 0): boolean {
  if (level.trailer && isJackknifed(car)) return true;
  return rigBoxes(car, level.trailer).some(
    (b) => !insideWorld(b, level.world.w, level.world.h, grow) || level.obstacles.some((o) => overlaps(b, o.box, grow)),
  );
}

/** Which bodies count for the goal. */
function goalBoxes(car: CarState, level: Level): Box[] {
  if (level.goal === 'car') return [carBox(car)];
  if (level.goal === 'trailer') return [trailerBox(car)];
  return [carBox(car), trailerBox(car)];
}

export function isInBay(car: CarState, level: Level, angleLimitDeg: number = CONFIG.parking.maxAngleDeg): boolean {
  const limit = (angleLimitDeg * Math.PI) / 180;
  const heading = level.goal === 'trailer' ? car.phi : car.a;
  const inside = goalBoxes(car, level).every((b) => containedIn(b, level.bay, CONFIG.parking.insideTolerance));
  return inside && angleDiff(heading, level.bay.a, true) <= limit;
}

function resolveHit(prev: SimState, moved: CarState): { car: CarState; hit: boolean; impact: number } {
  const bounced = { ...prev.car, v: -prev.car.v * CONFIG.car.bounce, steer: moved.steer };
  return { car: bounced, hit: true, impact: Math.abs(moved.v) };
}

function applyMotion(s: SimState, c: Controls, level: Level, dt: number): { car: CarState; hit: boolean; impact: number } {
  const moved = integrate(s.car, c, dt, level.trailer);
  if (!collides(moved, level)) return { car: moved, hit: false, impact: 0 };
  return resolveHit(s, moved);
}

function withEvents(s: SimState, ...ev: SimEvent[]): readonly SimEvent[] {
  return [...s.events, ...ev];
}

const isActive = (c: Controls): boolean => c.throttle !== 0 || c.steer !== 0 || c.brake;

/** One fixed step. Returns a new state; `events` lists what happened this step only. */
export function stepSim(prev: SimState, c: Controls, level: Level, dt: number): SimState {
  if (prev.status !== 'playing' && prev.status !== 'ready') return { ...prev, events: [] };
  const starting = prev.status === 'ready' && isActive(c);
  const base: SimState = { ...prev, status: starting ? 'playing' : prev.status, events: starting ? ['start'] : [] };
  const moving = base.status === 'playing';
  const { car, hit, impact } = applyMotion(base, moving ? c : { throttle: 0, brake: true, steer: 0 }, level, dt);
  let s: SimState = { ...base, car, time: moving ? base.time + dt : 0, cooldown: Math.max(0, base.cooldown - dt) };
  if (hit && s.cooldown <= 0) {
    s = { ...s, damage: s.damage + 1, cooldown: CONFIG.damage.hitCooldown, lastImpact: impact, events: withEvents(s, 'hit') };
  }
  return judge(s, level, dt);
}

function judge(s: SimState, level: Level, dt: number): SimState {
  if (s.status !== 'playing') return s;
  if (s.damage >= CONFIG.damage.wreckAt) return { ...s, status: 'wrecked', events: withEvents(s, 'wrecked') };
  const inBay = isInBay(s.car, level) && !collides(s.car, level, CONFIG.parking.clearance);
  const still = Math.abs(s.car.v) <= CONFIG.parking.maxSpeed;
  const holdTime = inBay && still ? s.hold * CONFIG.parking.holdSeconds + dt : 0;
  const hold = Math.min(1, holdTime / CONFIG.parking.holdSeconds);
  if (hold >= 1) return { ...s, inBay, hold, status: 'parked', events: withEvents(s, 'parked') };
  if (s.time >= level.timeLimit) return { ...s, inBay, hold, time: level.timeLimit, status: 'timeout', events: withEvents(s, 'timeout') };
  return { ...s, inBay, hold };
}
