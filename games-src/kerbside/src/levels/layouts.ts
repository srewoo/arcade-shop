// Parametric layouts: pull-in, reverse bay, parallel, angled, garage, trailer pitches.
import type { Box } from '../geom';
import type { Draft } from './build';
import { box, CAR_HH, CAR_HW, caravan, cone, kerb, parkedCar, pillar, slotRow, TOP_Y } from './build';
import type { Obstacle, Start } from './types';

const TINTS = [0, 3, 5, 1, 6, 2, 4];
const tints = (shift: number): number[] => TINTS.map((_, i) => TINTS[(i + shift) % TINTS.length] ?? 0);

export interface RowOpts {
  readonly name: string;
  readonly W: number;
  readonly aisle: number;
  readonly each: number;
  readonly across: readonly number[];
  readonly cones?: readonly (readonly [number, number])[];
  readonly start?: Start;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
  readonly kind?: 'pull-in' | 'reverse';
  readonly shift?: number;
  readonly lead?: number;
}

/** A bay in a nose-in row along the top wall with cars either side, an aisle, optional opposite row. */
export function rowBay(o: RowOpts): Draft {
  const x0 = 8 + (o.lead ?? 0);
  const bx = x0 + o.each * o.W;
  const w = Math.max(26, bx + (o.each + 1) * o.W + 6);
  const count = o.each * 2 + 1;
  const row = slotRow({ x0, pitch: o.W, count, skip: [o.each], top: 1.6, tints: tints(o.shift ?? 0), dir: 1 });
  const lane = 1.6 + 5.2;
  const bottom = lane + o.aisle;
  const opp = slotRow({ x0, pitch: o.W, count, skip: [], top: bottom + 5.2, tints: tints((o.shift ?? 0) + 3), dir: -1 });
  const across = opp.cars.filter((_, k) => o.across.includes(k));
  const cones = (o.cones ?? []).map(([x, y]) => cone(x, y));
  const h = bottom + (o.across.length > 0 ? 5.2 : 3.2);
  const start = o.start ?? { x: 4.5, y: lane + o.aisle / 2, a: 0 };
  return {
    name: o.name, kind: o.kind ?? 'reverse', world: { w, h }, start,
    bay: box(bx, 1.6 + 2.6, 2.6, o.W / 2, TOP_Y),
    obstacles: [kerb(0, 1.45, w, 1.45), ...row.cars, ...across, ...cones],
    paint: [...row.paint, ...(o.across.length > 0 ? opp.paint : [])],
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}

export interface ParallelOpts {
  readonly name: string;
  readonly gap: number;
  readonly lane: number;
  readonly opposite: boolean;
  readonly extra: boolean;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
  readonly shift?: number;
}

/** Parallel bay along a bottom kerb between two parked cars. */
export function parallelBay(o: ParallelOpts): Draft {
  const bw = 2.5;
  const h = 4 + o.lane + bw + 2;
  const kerbY = h - 2;
  const w = 42;
  const bx = 22;
  const cy = kerbY - 0.1 - CAR_HH;
  const t = tints(o.shift ?? 0);
  const cars: Obstacle[] = [
    parkedCar(bx - o.gap / 2 - CAR_HW, cy, 0, t[0] ?? 0),
    parkedCar(bx + o.gap / 2 + CAR_HW, cy, 0, t[1] ?? 0),
  ];
  if (o.extra) cars.push(parkedCar(bx - o.gap / 2 - 3 * CAR_HW - 0.8, cy, 0, t[2] ?? 0), parkedCar(bx + o.gap / 2 + 3 * CAR_HW + 0.8, cy, 0, t[3] ?? 0));
  const obstacles: Obstacle[] = [kerb(0, kerbY + 0.15, w, kerbY + 0.15), ...cars];
  if (o.opposite) obstacles.push(kerb(0, kerbY - bw - o.lane, w, kerbY - bw - o.lane), parkedCar(bx + 3, kerbY - bw - o.lane + CAR_HH + 0.3, Math.PI, t[4] ?? 0));
  return {
    name: o.name, kind: 'parallel', world: { w, h },
    start: { x: bx - o.gap / 2 - 3 * CAR_HW - 3.5, y: kerbY - bw - o.lane / 2 - 0.6, a: 0 },
    bay: box(bx, kerbY - bw / 2, o.gap / 2, bw / 2, 0), obstacles, paint: [box(bx, kerbY - bw / 2, o.gap / 2, bw / 2, 0)],
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}

export interface AngledOpts {
  readonly name: string;
  readonly tiltDeg: number;
  readonly W: number;
  readonly aisle: number;
  readonly each: number;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
  readonly shift?: number;
}

/** Angled bays: the whole row leans by `tiltDeg` from straight-in. */
export function angledBay(o: AngledOpts): Draft {
  const t = (o.tiltDeg * Math.PI) / 180;
  const a = TOP_Y + t;
  const L = 5.2;
  const pitch = o.W / Math.cos(t);
  const cy = 1.7 + (L / 2) * Math.cos(t) + (o.W / 2) * Math.sin(t);
  const count = o.each * 2 + 1;
  const x0 = 7 + L * Math.sin(t) / 2;
  const slot = (k: number): Box => box(x0 + k * pitch, cy, L / 2, o.W / 2, a);
  const tt = tints(o.shift ?? 0);
  const cars: Obstacle[] = [];
  const paint: Box[] = [];
  for (let k = 0; k < count; k++) {
    paint.push(slot(k));
    if (k !== o.each) cars.push(parkedCar(slot(k).x, cy, a, tt[k % tt.length] ?? 0));
  }
  const w = x0 + count * pitch + 4;
  const lane = cy + L / 2 + 1.5;
  return {
    name: o.name, kind: 'angled', world: { w, h: lane + o.aisle + 2 },
    start: { x: 4, y: lane + o.aisle / 2 + 0.4, a: 0 },
    bay: slot(o.each), obstacles: [kerb(0, 1.45, w, 1.45), ...cars], paint,
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}

export interface GarageOpts {
  readonly name: string;
  readonly W: number;
  readonly aisle: number;
  readonly pillars: boolean;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
}

/** A walled garage bay opening onto an aisle, with a parked car opposite. */
export function garageBay(o: GarageOpts): Draft {
  const bx = 15;
  const top = 1.6;
  const half = o.W / 2;
  const L = 5.4;
  const walls = [kerb(bx - half - 0.3, top, bx - half - 0.3, top + L + 0.4, 0.6, 'wall'), kerb(bx + half + 0.3, top, bx + half + 0.3, top + L + 0.4, 0.6, 'wall'), kerb(0, 1.45, 30, 1.45)];
  const lane = top + L + 0.4;
  const extras = o.pillars ? [pillar(bx - 4.2, lane + 1.4), pillar(bx + 4.4, lane + 2.4)] : [];
  const opp = [parkedCar(bx + 1, lane + o.aisle + CAR_HH - 0.2, Math.PI, 2)];
  return {
    name: o.name, kind: 'garage', world: { w: 30, h: lane + o.aisle + 2.6 },
    start: { x: 5, y: lane + o.aisle / 2 - 0.4, a: 0 },
    bay: box(bx, top + L / 2, L / 2, half, TOP_Y), obstacles: [...walls, ...extras, ...opp],
    paint: [box(bx, top + L / 2, L / 2, half, TOP_Y)],
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}

export interface PitchOpts {
  readonly name: string;
  readonly W: number;
  readonly aisle: number;
  readonly neighbours: boolean;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
}

/** Caravan pitch: only the trailer must end inside the bay; reverse it in from the aisle. */
export function trailerPitch(o: PitchOpts): Draft {
  const bx = 21;
  const L = 4.4;
  const top = 1.6;
  const sides = o.neighbours ? [caravan(bx - o.W - 0.5, top + L / 2, TOP_Y, 4), caravan(bx + o.W + 0.5, top + L / 2, TOP_Y, 1)] : [kerb(bx - o.W / 2 - 0.5, top, bx - o.W / 2 - 0.5, top + L, 0.4), kerb(bx + o.W / 2 + 0.5, top, bx + o.W / 2 + 0.5, top + L, 0.4)];
  const lane = top + L;
  const h = lane + o.aisle + 2;
  return {
    name: o.name, kind: 'trailer', world: { w: 42, h }, trailer: true, goal: 'trailer',
    start: { x: 7, y: lane + o.aisle / 2, a: 0 },
    bay: box(bx, top + L / 2, L / 2, o.W / 2, TOP_Y),
    obstacles: [kerb(0, 1.45, 42, 1.45), ...sides, kerb(0, lane + o.aisle, 42, lane + o.aisle)],
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}
export interface RigBayOpts {
  readonly name: string;
  readonly length: number;
  readonly width: number;
  readonly offset: number;
  readonly kerbed: boolean;
  readonly timeLimit: number;
  readonly parTime: number;
  readonly tip: string;
}

/** Straight bay for the whole rig (car + trailer) beside a kerb or between two posts. */
export function rigBay(o: RigBayOpts): Draft {
  const bx = 25;
  const kerbY = 14;
  const by = kerbY - o.width / 2;
  const obstacles = [kerb(0, kerbY + 0.15, 50, kerbY + 0.15), kerb(0, 1.5, 50, 1.5), parkedCar(bx - o.length / 2 - CAR_HW, kerbY - 1.0, 0, 3), parkedCar(bx + o.length / 2 + CAR_HW, kerbY - 1.0, 0, 5)];
  if (!o.kerbed) obstacles.push(cone(bx - 2, by - o.width / 2 - 0.55), cone(bx + 3, by - o.width / 2 - 0.55));
  return {
    name: o.name, kind: 'trailer', world: { w: 50, h: kerbY + 2 }, trailer: true, goal: 'both',
    start: { x: 8, y: by - o.offset, a: 0 }, bay: box(bx, by, o.length / 2, o.width / 2, 0), obstacles,
    timeLimit: o.timeLimit, parTime: o.parTime, tip: o.tip,
  };
}
