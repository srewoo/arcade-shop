// Kinematic hybrid-A* planner. It proves a level is solvable with a safety margin
// by finding a chain of constant-steer arcs from the start pose into the bay.
import { CONFIG } from './config';
import { angleDiff, wrapAngle } from './geom';
import type { CarState } from './car';
import { makeCar } from './car';
import type { Level } from './levels/types';
import { collides, isInBay } from './sim';

export interface Move {
  readonly steer: number;
  readonly dir: 1 | -1;
}
export interface Plan {
  readonly found: boolean;
  readonly nodes: number;
  readonly moves: readonly Move[];
  /** Total driven distance in metres. */
  readonly distance: number;
}

interface Node {
  readonly car: CarState;
  readonly g: number;
  readonly f: number;
  readonly parent: Node | null;
  readonly move: Move | null;
}

const { wheelbase, maxSteer } = CONFIG.car;
const STEERS = [-maxSteer, -maxSteer / 2, 0, maxSteer / 2, maxSteer];

/** Drive `len` metres along a constant-steer arc; undefined if blocked. */
export function arc(s: CarState, m: Move, len: number, level: Level, margin: number): CarState | undefined {
  const n = Math.max(2, Math.ceil(len / 0.2));
  const ds = (len / n) * m.dir;
  let cur = s;
  for (let i = 0; i < n; i++) {
    const yaw = (ds / wheelbase) * Math.tan(m.steer);
    const aMid = cur.a + yaw / 2;
    const phi = level.trailer ? nextPhi(cur, ds, yaw) : 0;
    const next: CarState = { ...cur, x: cur.x + ds * Math.cos(aMid), y: cur.y + ds * Math.sin(aMid), a: wrapAngle(cur.a + yaw), phi };
    cur = { ...next, phi: level.trailer ? phi : next.a };
    if (collides(cur, level, margin)) return undefined;
  }
  return cur;
}

function nextPhi(s: CarState, ds: number, yaw: number): number {
  const rel = s.a - s.phi;
  const t = CONFIG.trailer;
  return wrapAngle(s.phi + (ds * Math.sin(rel) - t.hitchBehindAxle * yaw * Math.cos(rel)) / t.drawbar);
}

function key(c: CarState, level: Level): string {
  const { cell, headingBins } = CONFIG.solver;
  const hb = Math.round(((c.a + Math.PI) / (2 * Math.PI)) * headingBins) % headingBins;
  const rel = level.trailer ? Math.round((wrapAngle(c.a - c.phi) / 0.3)) : 0;
  return `${Math.round(c.x / cell)},${Math.round(c.y / cell)},${hb},${rel}`;
}

function heuristic(c: CarState, level: Level): number {
  const b = level.bay;
  const dist = Math.hypot(c.x - b.x, c.y - b.y);
  const heading = level.goal === 'trailer' ? c.phi : c.a;
  return dist + 2.2 * angleDiff(heading, b.a, true);
}

class Heap {
  private readonly items: Node[] = [];
  get size(): number { return this.items.length; }
  push(n: Node): void {
    const a = this.items;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if ((a[p] as Node).f <= (a[i] as Node).f) break;
      [a[p], a[i]] = [a[i] as Node, a[p] as Node];
      i = p;
    }
  }
  pop(): Node {
    const a = this.items;
    const top = a[0] as Node;
    const last = a.pop() as Node;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && (a[l] as Node).f < (a[m] as Node).f) m = l;
        if (r < a.length && (a[r] as Node).f < (a[m] as Node).f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i] as Node, a[m] as Node];
        i = m;
      }
    }
    return top;
  }
}

function trace(n: Node): Move[] {
  const out: Move[] = [];
  for (let cur: Node | null = n; cur?.move; cur = cur.parent) out.unshift(cur.move);
  return out;
}

/** Try short finishing arcs from a node; returns the winning node when one lands in the bay. */
function finish(n: Node, level: Level, margin: number): Node | undefined {
  for (const len of [0.3, 0.7, 1.4]) {
    for (const dir of [1, -1] as const) {
      for (const steer of [0, -maxSteer / 4, maxSteer / 4]) {
        const car = arc(n.car, { steer, dir }, len, level, margin);
        if (car && isInBay(car, level, 9)) return { car, g: n.g + len, f: 0, parent: n, move: { steer, dir } };
      }
    }
  }
  return undefined;
}

export function solve(level: Level, margin: number = CONFIG.solver.margin): Plan {
  const { maxNodes, weight } = CONFIG.solver;
  const start = makeCar(level.start.x, level.start.y, level.start.a);
  const open = new Heap();
  const seen = new Set<string>([key(start, level)]);
  open.push({ car: start, g: 0, f: heuristic(start, level) * weight, parent: null, move: null });
  let nodes = 0;
  while (open.size > 0 && nodes < maxNodes) {
    const cur = open.pop();
    nodes++;
    if (isInBay(cur.car, level, 9)) return done(cur, nodes);
    if (heuristic(cur.car, level) < 6) {
      const win = finish(cur, level, margin);
      if (win) return done(win, nodes);
    }
    expand(cur, level, margin, seen, open, weight);
  }
  return { found: false, nodes, moves: [], distance: 0 };
}

function done(n: Node, nodes: number): Plan {
  return { found: true, nodes, moves: trace(n), distance: n.g };
}

function expand(cur: Node, level: Level, margin: number, seen: Set<string>, open: Heap, weight: number): void {
  for (const dir of [1, -1] as const) {
    for (const steer of STEERS) {
      const car = arc(cur.car, { steer, dir }, 1.2, level, margin);
      if (!car) continue;
      const k = key(car, level);
      if (seen.has(k)) continue;
      seen.add(k);
      const turn = cur.move && (cur.move.dir !== dir ? 3 : 0);
      const g = cur.g + 1.2 + (dir === -1 ? 0.3 : 0) + (turn ?? 0);
      open.push({ car, g, f: g + weight * heuristic(car, level), parent: cur, move: { steer, dir } });
    }
  }
}
