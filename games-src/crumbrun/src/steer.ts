// Direction choice at tile centres for cats (chase / flee / wander / pounce).
import { canMove, neighbor } from './maze';
import type { Maze } from './maze';
import type { DistCache } from './graph';
import type { Target } from './cats';
import { MOVES, opposite } from './types';
import type { Access, Dir, MoveDir, Rng, Tile } from './types';

export interface SteerCtx {
  readonly maze: Maze;
  readonly dists: DistCache;
  readonly rng: Rng;
  readonly access: Access;
}

function options(ctx: SteerCtx, t: Tile, current: Dir, allowReverse: boolean): MoveDir[] {
  const all = MOVES.filter((d) => canMove(ctx.maze, t.col, t.row, d, ctx.access));
  if (allowReverse) return all;
  const fwd = all.filter((d) => d !== opposite(current));
  return fwd.length > 0 ? fwd : all;
}

function pick(list: readonly MoveDir[], rng: Rng): Dir {
  return list.length === 0 ? 'N' : (list[Math.floor(rng() * list.length)] as MoveDir);
}

/** Pick the legal move whose next tile is closest (path distance) to `goal`. */
export function chaseDir(ctx: SteerCtx, at: Tile, current: Dir, goal: Tile): Dir {
  const opts = options(ctx, at, current, false);
  let best: Dir = 'N';
  let bestD = Infinity;
  for (const d of opts) {
    const n = neighbor(ctx.maze, at.col, at.row, d);
    const dist = ctx.dists.dist(goal, n, ctx.access);
    const score = dist < 0 ? 9999 : dist;
    if (score < bestD) {
      bestD = score;
      best = d;
    }
  }
  return best;
}

/** Drenched cats run to whichever neighbour is farthest from Pip. */
export function fleeDir(ctx: SteerCtx, at: Tile, current: Dir, pip: Tile): Dir {
  const opts = options(ctx, at, current, false);
  let bestD = -1;
  let best: MoveDir[] = [];
  for (const d of opts) {
    const n = neighbor(ctx.maze, at.col, at.row, d);
    const dist = ctx.dists.dist(pip, n, 'pip');
    if (dist > bestD) {
      bestD = dist;
      best = [d];
    } else if (dist === bestD) best.push(d);
  }
  return pick(best, ctx.rng);
}

export function steer(ctx: SteerCtx, at: Tile, current: Dir, target: Target): Dir {
  if (target.kind === 'wander') return pick(options(ctx, at, current, false), ctx.rng);
  if (target.kind === 'pounce') {
    if (canMove(ctx.maze, at.col, at.row, target.dir, ctx.access)) return target.dir;
    return chaseDir(ctx, at, current, target.tile);
  }
  return chaseDir(ctx, at, current, target.tile);
}
