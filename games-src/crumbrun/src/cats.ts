// Cat personalities: pure target selection. Steering lives in steer.ts.
import { TUNING } from './config/tuning';
import { passable } from './maze';
import type { Maze } from './maze';
import type { CatKind, Dir, MoveDir, Tile } from './types';

export const BISCUIT_RADIUS = TUNING.biscuit.radiusTiles;
export const BISCUIT_CHASE_SEC = TUNING.biscuit.chaseSec;

/** Tuxedo's pounce: see a straight line, freeze and flatten (wind-up), dash, then rest. */
export type PouncePhase = 'idle' | 'windup' | 'dash' | 'cooldown';
export interface PounceState {
  phase: PouncePhase;
  t: number;
}

export function newPounce(): PounceState {
  return { phase: 'idle', t: 0 };
}

/** Advance the pounce machine one tick. Returns 'windup' on the tick a wind-up begins (for the sound cue). */
export function stepPounce(s: PounceState, canSee: boolean, dt: number): 'windup' | null {
  const cfg = TUNING.pounce;
  if (s.phase === 'idle') {
    if (!canSee) return null;
    s.phase = 'windup';
    s.t = cfg.windupSec;
    return 'windup';
  }
  s.t -= dt;
  if (s.phase === 'windup' && s.t <= 0) {
    if (canSee) {
      s.phase = 'dash';
      s.t = cfg.dashMaxSec;
    } else s.phase = 'idle';
  } else if (s.phase === 'dash' && (s.t <= 0 || !canSee)) {
    s.phase = 'cooldown';
    s.t = cfg.cooldownSec;
  } else if (s.phase === 'cooldown' && s.t <= 0) s.phase = 'idle';
  return null;
}

export type Target =
  | { readonly kind: 'tile'; readonly tile: Tile }
  | { readonly kind: 'pounce'; readonly tile: Tile; readonly dir: MoveDir }
  | { readonly kind: 'wander' };

export interface CatBrain {
  routeIdx: number;
  chaseTimer: number;
}

export interface CatCtx {
  readonly maze: Maze;
  readonly pip: Tile;
  readonly pipDir: Dir;
  readonly cat: Tile;
}

/** Direction from a to b if they share a row/column with only floor between; else null. */
export function lineOfSight(maze: Maze, a: Tile, b: Tile): MoveDir | null {
  if (a.col === b.col && a.row === b.row) return null;
  if (a.row === b.row) {
    const step = b.col > a.col ? 1 : -1;
    for (let c = a.col + step; c !== b.col; c += step) if (!passable(maze, c, a.row, 'cat')) return null;
    return step > 0 ? 'R' : 'L';
  }
  if (a.col === b.col) {
    const step = b.row > a.row ? 1 : -1;
    for (let r = a.row + step; r !== b.row; r += step) if (!passable(maze, a.col, r, 'cat')) return null;
    return step > 0 ? 'D' : 'U';
  }
  return null;
}

/** Ginger: reflect Pip through the maze centre; if that is a wall, take the nearest floor tile. */
export function mirrorTarget(maze: Maze, pip: Tile): Tile {
  const want = { col: maze.cols - 1 - pip.col, row: maze.rows - 1 - pip.row };
  if (passable(maze, want.col, want.row, 'cat')) return want;
  let best = pip;
  let bestD = Infinity;
  for (let row = 0; row < maze.rows; row++) {
    for (let col = 0; col < maze.cols; col++) {
      if (!passable(maze, col, row, 'cat')) continue;
      const d = (col - want.col) ** 2 + (row - want.row) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { col, row };
      }
    }
  }
  return best;
}

/** Biscuit's brain update: proximity starts a 4 s chase, otherwise advance the patrol. */
export function updateBiscuit(brain: CatBrain, route: readonly Tile[], cat: Tile, pipDist: number, dt: number): void {
  if (pipDist >= 0 && pipDist <= BISCUIT_RADIUS) brain.chaseTimer = BISCUIT_CHASE_SEC;
  else brain.chaseTimer = Math.max(0, brain.chaseTimer - dt);
  const wp = route[brain.routeIdx % route.length];
  if (wp && wp.col === cat.col && wp.row === cat.row) brain.routeIdx = (brain.routeIdx + 1) % route.length;
}

export function catTarget(kind: CatKind, ctx: CatCtx, brain: CatBrain): Target {
  switch (kind) {
    case 'smudge':
      return { kind: 'tile', tile: ctx.pip };
    case 'ginger':
      return { kind: 'tile', tile: mirrorTarget(ctx.maze, ctx.pip) };
    case 'biscuit': {
      if (brain.chaseTimer > 0) return { kind: 'tile', tile: ctx.pip };
      const wp = ctx.maze.route[brain.routeIdx % ctx.maze.route.length] ?? ctx.pip;
      return { kind: 'tile', tile: wp };
    }
    case 'tuxedo': {
      const dir = lineOfSight(ctx.maze, ctx.cat, ctx.pip);
      return dir ? { kind: 'pounce', tile: ctx.pip, dir } : { kind: 'wander' };
    }
  }
}
