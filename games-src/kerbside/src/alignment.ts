// Live parking feedback: how well the rig lines up with the bay. Pure and DOM-free.
import type { CarState } from './car';
import { carBox, trailerBox } from './car';
import { CONFIG } from './config';
import type { Box } from './geom';
import { angleDiff } from './geom';
import type { Level } from './levels/types';

export interface Alignment {
  /** Share (0..1) of the goal body that lies inside the bay. */
  readonly overlap: number;
  /** Heading error against the bay axis, degrees (axis-symmetric, 0..90). */
  readonly angleDeg: number;
  readonly angleOk: boolean;
  /** Combined 0..1 closeness used for the bay tint and the HUD meter. */
  readonly quality: number;
}

const SAMPLES_U = 7;
const SAMPLES_V = 5;

/** Fraction of a grid of points on `body` that fall inside `bay`. */
export function overlapFraction(body: Box, bay: Box): number {
  const bc = Math.cos(body.a);
  const bs = Math.sin(body.a);
  const yc = Math.cos(bay.a);
  const ys = Math.sin(bay.a);
  let inside = 0;
  for (let i = 0; i < SAMPLES_U; i++) {
    for (let j = 0; j < SAMPLES_V; j++) {
      const lu = ((i + 0.5) / SAMPLES_U * 2 - 1) * body.hw;
      const lv = ((j + 0.5) / SAMPLES_V * 2 - 1) * body.hh;
      const wx = body.x + bc * lu - bs * lv - bay.x;
      const wy = body.y + bs * lu + bc * lv - bay.y;
      const u = wx * yc + wy * ys;
      const v = -wx * ys + wy * yc;
      if (Math.abs(u) <= bay.hw && Math.abs(v) <= bay.hh) inside++;
    }
  }
  return inside / (SAMPLES_U * SAMPLES_V);
}

const goalBodies = (car: CarState, level: Level): Box[] => {
  if (level.goal === 'car') return [carBox(car)];
  if (level.goal === 'trailer') return [trailerBox(car)];
  return [carBox(car), trailerBox(car)];
};

export function alignmentFor(car: CarState, level: Level): Alignment {
  const bodies = goalBodies(car, level);
  const overlap = Math.min(...bodies.map((b) => overlapFraction(b, level.bay)));
  const heading = level.goal === 'trailer' ? car.phi : car.a;
  const angleDeg = (angleDiff(heading, level.bay.a, true) * 180) / Math.PI;
  const angleOk = angleDeg <= CONFIG.parking.maxAngleDeg;
  const angleFactor = 1 - Math.min(1, Math.max(0, angleDeg - CONFIG.parking.maxAngleDeg) / 33);
  return { overlap, angleDeg, angleOk, quality: overlap * angleFactor };
}

const smooth = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** 0 = not close (amber bay) .. 1 = aligned (green bay). */
export const closeness = (quality: number, inBay: boolean): number => (inBay ? 1 : smooth((quality - 0.45) / 0.5) * 0.85);

/** Linear blend of two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const ch = (hex: string, s: number): number => parseInt(hex.slice(s, s + 2), 16);
  const out = [1, 3, 5].map((s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * k));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
