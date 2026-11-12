// Continuous movement along the tile graph. Positions are in tile units where
// a tile centre is an integer coordinate. Decisions happen only at centres.
import { canMove, isEdge } from './maze';
import type { Maze } from './maze';
import { VEC, opposite } from './types';
import type { Access, Dir, MoveDir } from './types';

export interface Mover {
  x: number;
  y: number;
  /** Position at the previous tick, for render interpolation only. */
  px: number;
  py: number;
  dir: Dir;
}

/** A jump bigger than this between ticks (tunnel wrap, respawn) is never interpolated. */
const MAX_LERP_TILES = 1.5;

/** Render position between the previous and current tick. alpha = accumulator / step. */
export function lerpMover(m: Pick<Mover, 'x' | 'y' | 'px' | 'py'>, alpha: number): { x: number; y: number } {
  const a = Math.min(1, Math.max(0, alpha));
  if (Math.abs(m.x - m.px) > MAX_LERP_TILES || Math.abs(m.y - m.py) > MAX_LERP_TILES) return { x: m.x, y: m.y };
  return { x: m.px + (m.x - m.px) * a, y: m.py + (m.y - m.py) * a };
}

/** Called when a mover sits exactly on a tile centre; returns the direction to take. */
export type Chooser = (m: Mover, col: number, row: number) => Dir;

const EPS = 1e-6;

function atCenter(m: Mover): boolean {
  const rx = Math.round(m.x);
  const ry = Math.round(m.y);
  if (Math.abs(m.x - rx) < EPS && Math.abs(m.y - ry) < EPS) {
    m.x = rx;
    m.y = ry;
    return true;
  }
  return false;
}

function distToCenter(m: Mover): number {
  if (atCenter(m)) return 1;
  const v = VEC[m.dir];
  if (v.dx > 0) return Math.ceil(m.x) - m.x;
  if (v.dx < 0) return m.x - Math.floor(m.x);
  if (v.dy > 0) return Math.ceil(m.y) - m.y;
  return m.y - Math.floor(m.y);
}

function wrapEdge(m: Mover, maze: Maze): void {
  if (m.x === -1 && m.dir === 'L') m.x = maze.cols;
  else if (m.x === maze.cols && m.dir === 'R') m.x = -1;
}

/** Move `dist` tiles, consulting `choose` at every tile centre reached. */
export function advance(maze: Maze, m: Mover, dist: number, choose: Chooser): void {
  let left = dist;
  for (let guard = 0; left > EPS && guard < 16; guard++) {
    if (atCenter(m) && !isEdge(maze, m.x)) {
      m.dir = choose(m, m.x, m.y);
    }
    if (m.dir === 'N') return;
    const d = distToCenter(m);
    const step = Math.min(d, left);
    const v = VEC[m.dir];
    m.x += v.dx * step;
    m.y += v.dy * step;
    left -= step;
    if (step === d) atCenter(m);
    wrapEdge(m, maze);
  }
}

/**
 * Pip's chooser: take the buffered turn if it is legal here, otherwise keep
 * going straight, otherwise stop. The buffered turn survives until legal.
 */
export interface TurnBuffer {
  want: Dir;
}

export function pipChooser(maze: Maze, buf: TurnBuffer, access: Access = 'pip'): Chooser {
  return (m, col, row) => {
    if (buf.want !== 'N' && canMove(maze, col, row, buf.want as MoveDir, access)) {
      const d = buf.want;
      buf.want = 'N';
      return d;
    }
    if (m.dir !== 'N' && canMove(maze, col, row, m.dir as MoveDir, access)) return m.dir;
    return 'N';
  };
}

/** A requested 180 degree turn is legal anywhere in a corridor. Returns true if applied. */
export function tryReverse(m: Mover, buf: TurnBuffer): boolean {
  if (m.dir !== 'N' && buf.want === opposite(m.dir)) {
    m.dir = buf.want;
    buf.want = 'N';
    return true;
  }
  return false;
}
