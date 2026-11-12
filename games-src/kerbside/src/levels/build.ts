// Level building blocks. Everything is measured in metres, y grows downward.
import { CONFIG } from '../config';
import type { Box } from '../geom';
import type { Goal, Level, LevelKind, Obstacle, ObstacleKind, Start } from './types';

export const CAR_HW = CONFIG.car.length / 2;
export const CAR_HH = CONFIG.car.width / 2;
const UP = -Math.PI / 2;

export const box = (x: number, y: number, hw: number, hh: number, a = 0): Box => ({ x, y, hw, hh, a });
const obs = (b: Box, kind: ObstacleKind, tint = 0): Obstacle => ({ box: b, kind, tint });

export const parkedCar = (x: number, y: number, a: number, tint: number): Obstacle => obs(box(x, y, CAR_HW, CAR_HH, a), 'car', tint);
export const caravan = (x: number, y: number, a: number, tint: number): Obstacle =>
  obs(box(x, y, CONFIG.trailer.length / 2, CONFIG.trailer.width / 2, a), 'caravan', tint);
export const cone = (x: number, y: number): Obstacle => obs(box(x, y, 0.24, 0.24), 'cone');
export const pillar = (x: number, y: number): Obstacle => obs(box(x, y, 0.5, 0.5), 'pillar');

/** A straight kerb or wall between two points. */
export function kerb(x1: number, y1: number, x2: number, y2: number, thick = 0.3, kind: ObstacleKind = 'kerb'): Obstacle {
  const len = Math.hypot(x2 - x1, y2 - y1);
  return obs(box((x1 + x2) / 2, (y1 + y2) / 2, len / 2, thick / 2, Math.atan2(y2 - y1, x2 - x1)), kind);
}

export interface Draft {
  readonly name: string;
  readonly kind: LevelKind;
  readonly world: { readonly w: number; readonly h: number };
  readonly start: Start;
  readonly bay: Box;
  readonly obstacles: readonly Obstacle[];
  readonly paint?: readonly Box[];
  readonly goal?: Goal;
  readonly trailer?: boolean;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
}

export function finish(id: number, d: Draft): Level {
  return { ...d, id, goal: d.goal ?? 'car', trailer: d.trailer ?? false, paint: d.paint ?? [d.bay] };
}

/** Turn a level half a turn so the same layout can be driven the other way round. */
export function rotate180(d: Draft): Draft {
  const { w, h } = d.world;
  const flip = (b: Box): Box => ({ ...b, x: w - b.x, y: h - b.y, a: b.a + Math.PI });
  return {
    ...d,
    start: { x: w - d.start.x, y: h - d.start.y, a: d.start.a + Math.PI },
    bay: flip(d.bay),
    obstacles: d.obstacles.map((o) => ({ ...o, box: flip(o.box) })),
    paint: d.paint?.map(flip),
  };
}

/** Row of nose-in slots along the top wall. Slot k sits at x = x0 + k*pitch. */
export interface Row {
  readonly x0: number;
  readonly pitch: number;
  readonly count: number;
  readonly skip: readonly number[];
  readonly top: number;
  readonly tints: readonly number[];
  readonly dir: 1 | -1;
}

export function slotRow(r: Row): { cars: Obstacle[]; paint: Box[] } {
  const cars: Obstacle[] = [];
  const paint: Box[] = [];
  for (let k = 0; k < r.count; k++) {
    const x = r.x0 + k * r.pitch;
    const a = r.dir === 1 ? UP : -UP;
    const cy = r.dir === 1 ? r.top + 2.6 : r.top - 2.6;
    paint.push(box(x, cy, 2.6, r.pitch / 2, a));
    if (!r.skip.includes(k)) cars.push(parkedCar(x, r.dir === 1 ? r.top + CAR_HW : r.top - CAR_HW, a, r.tints[k % r.tints.length] ?? 0));
  }
  return { cars, paint };
}
export const TOP_Y = UP;
