// Clay flight. Paths are analytic (closed form in age), so the simulation never
// accumulates integration error and tests can ask "where is this clay at t".
import { CONFIG } from './config';
import type { World } from './world';

export type ClayKind = 'std' | 'mini' | 'gold';
export type Side = 'L' | 'R';

/** Plan-time description of one clay (world-size independent). */
export interface ClaySpec {
  readonly side: Side;
  /** Seconds after the throw starts that this clay leaves its house. */
  readonly delay: number;
  /** Seconds in the air until it is back at roof height. */
  readonly flight: number;
  /** Apex height above the roof as a fraction of world.arc. */
  readonly apex: number;
  /** Horizontal travel (toward the far side) as a fraction of world width, before wind. */
  readonly range: number;
  readonly kind: ClayKind;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const sideDir = (side: Side): 1 | -1 => (side === 'L' ? 1 : -1);
export const houseX = (side: Side, world: World): number =>
  side === 'L' ? world.w * CONFIG.world.houseX : world.w * (1 - CONFIG.world.houseX);

export function clayRadius(kind: ClayKind): number {
  return kind === 'mini' ? CONFIG.clay.radius * CONFIG.clay.miniScale : CONFIG.clay.radius;
}

/** Position `age` seconds after launch. `wind` is in world widths per second squared. */
export function clayPoint(spec: ClaySpec, world: World, wind: number, age: number): Point {
  const s = age / spec.flight;
  const x = houseX(spec.side, world) + sideDir(spec.side) * spec.range * world.w * s + 0.5 * wind * world.w * age * age;
  const y = world.launchY - 4 * spec.apex * world.arc * s * (1 - s);
  return { x, y };
}

/** Velocity (world units per second) at `age`. */
export function clayVelocity(spec: ClaySpec, world: World, wind: number, age: number): Point {
  const s = age / spec.flight;
  return {
    x: (sideDir(spec.side) * spec.range * world.w) / spec.flight + wind * world.w * age,
    y: (-4 * spec.apex * world.arc * (1 - 2 * s)) / spec.flight,
  };
}

/** Age at which the clay reaches the ground line (after passing roof height). */
export function landingAge(spec: ClaySpec, world: World): number {
  const drop = world.groundY - world.launchY;
  const a = 4 * spec.apex * world.arc;
  if (drop <= 0 || a <= 0) return spec.flight;
  // y - launchY = a * s * (s - 1) = drop  =>  s = (1 + sqrt(1 + 4 drop / a)) / 2
  const s = (1 + Math.sqrt(1 + (4 * drop) / a)) / 2;
  return s * spec.flight;
}

/** True when the whole flight stays inside the world with the configured margin. */
export function pathInBounds(spec: ClaySpec, world: World, wind: number, samples = 24): boolean {
  const m = CONFIG.clay.margin;
  const end = landingAge(spec, world);
  for (let i = 0; i <= samples; i++) {
    const p = clayPoint(spec, world, wind, (end * i) / samples);
    if (p.x < world.w * m || p.x > world.w * (1 - m)) return false;
    if (p.y < world.h * 0.06) return false;
  }
  return true;
}

/** A launched clay in the simulation. */
export interface Clay {
  readonly id: number;
  readonly throwIndex: number;
  readonly spec: ClaySpec;
  readonly radius: number;
  readonly wind: number;
  age: number;
  x: number;
  y: number;
  px: number;
  py: number;
  state: 'flying' | 'broken' | 'missed';
}

export function launchClay(id: number, throwIndex: number, spec: ClaySpec, world: World, wind: number): Clay {
  const p = clayPoint(spec, world, wind, 0);
  return { id, throwIndex, spec, radius: clayRadius(spec.kind), wind, age: 0, x: p.x, y: p.y, px: p.x, py: p.y, state: 'flying' };
}

export function stepClay(c: Clay, world: World, dt: number): void {
  c.px = c.x;
  c.py = c.y;
  c.age += dt;
  const p = clayPoint(c.spec, world, c.wind, c.age);
  c.x = p.x;
  c.y = p.y;
}
