// Level validity: pure checks used by the unit tests (and handy when authoring a hole).
import { CONFIG } from '../config';
import { inShape, insidePolys, polysToSegments, closestOnSegment } from '../physics/geometry';
import { moverExtent } from '../physics/movers';
import type { HoleDef, Shape, Vec } from '../physics/types';

const WALL_R = CONFIG.ball.r + CONFIG.wall.half;
const GRID = 5;

/** Is a ball centre at (x, y) on playable ground (inside, clear of walls and posts, dry)? */
export function isFree(hole: HoleDef, x: number, y: number): boolean {
  if (!insidePolys(x, y, hole.walls)) return false;
  const tmp: Vec = { x: 0, y: 0 };
  for (const s of polysToSegments(hole.walls)) {
    if (closestOnSegment(x, y, s.ax, s.ay, s.bx, s.by, tmp) < WALL_R * WALL_R) return false;
  }
  for (const p of hole.posts ?? []) if (Math.hypot(x - p.x, y - p.y) < p.r + CONFIG.ball.r) return false;
  return !(hole.hazards ?? []).some((h) => inShape(x, y, h.shape));
}

export interface Field { readonly w: number; readonly h: number; readonly d: Float32Array; at(x: number, y: number): number }

/** Walking distance (units) from the cup over free cells; Infinity where unreachable. */
export function distanceField(hole: HoleDef): Field {
  const w = Math.ceil(CONFIG.world.w / GRID);
  const h = Math.ceil(CONFIG.world.h / GRID);
  const d = new Float32Array(w * h).fill(Infinity);
  const free = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) free[j * w + i] = isFree(hole, i * GRID + GRID / 2, j * GRID + GRID / 2) ? 1 : 0;
  const ci = Math.floor(hole.cup.x / GRID);
  const cj = Math.floor(hole.cup.y / GRID);
  const queue: number[] = [cj * w + ci];
  d[cj * w + ci] = 0;
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head] as number;
    const x = cur % w;
    const y = (cur - x) / w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if ((dx === 0 && dy === 0) || nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      const step = (dx !== 0 && dy !== 0 ? 1.4142 : 1) * GRID;
      if (!free[n] || (d[n] as number) <= (d[cur] as number) + step) continue;
      d[n] = (d[cur] as number) + step;
      queue.push(n);
    }
  }
  const at = (x: number, y: number): number => {
    const i = Math.min(w - 1, Math.max(0, Math.floor(x / GRID)));
    const j = Math.min(h - 1, Math.max(0, Math.floor(y / GRID)));
    return d[j * w + i] as number;
  };
  return { w, h, d, at };
}

function shapeInBounds(s: Shape): boolean {
  const b = s.t === 'r' ? [s.x, s.y, s.x + s.w, s.y + s.h] : [s.x - s.rx, s.y - s.ry, s.x + s.rx, s.y + s.ry];
  return (b[0] as number) >= 0 && (b[1] as number) >= 0 && (b[2] as number) <= CONFIG.world.w && (b[3] as number) <= CONFIG.world.h;
}

/** Returns a list of problems; an empty list means the hole is playable. */
export function validateHole(hole: HoleDef): string[] {
  const bad: string[] = [];
  if (hole.par < 2 || hole.par > 5) bad.push('par out of range');
  if (hole.walls.some((p) => p.length < 3)) bad.push('degenerate polygon');
  if (!isFree(hole, hole.tee.x, hole.tee.y)) bad.push('tee is inside a wall, post or hazard');
  if (!isFree(hole, hole.cup.x, hole.cup.y)) bad.push('cup is not on playable ground');
  if ((hole.sand ?? []).some((s) => inShape(hole.cup.x, hole.cup.y, s.shape))) bad.push('cup in sand');
  if ((hole.sand ?? []).some((s) => inShape(hole.tee.x, hole.tee.y, s.shape))) bad.push('tee in sand');
  for (const s of [...(hole.sand ?? []), ...(hole.hazards ?? []), ...(hole.slopes ?? [])]) {
    if (!shapeInBounds(s.shape)) bad.push('shape outside the world');
  }
  for (const sl of hole.slopes ?? []) if (Math.hypot(sl.ax, sl.ay) > CONFIG.slope.hold) bad.push('slope too steep to hold a resting ball');
  for (const m of hole.movers ?? []) {
    const e = moverExtent(m);
    const pad = CONFIG.ball.r * 2;
    for (const p of [hole.tee, hole.cup]) {
      if (p.x > e.x0 - pad && p.x < e.x1 + pad && p.y > e.y0 - pad && p.y < e.y1 + pad) bad.push('mover sweeps over tee or cup');
    }
  }
  if (bad.length === 0 && !Number.isFinite(distanceField(hole).at(hole.tee.x, hole.tee.y))) bad.push('cup unreachable from tee');
  return bad;
}
