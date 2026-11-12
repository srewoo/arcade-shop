// Tile graph: BFS distance fields (with tunnel wrap) and maze validation.
import { canMove, ITEM_CRUMB, ITEM_PISTOL, ITEM_SUGAR, neighbor, passable } from './maze';
import type { Maze } from './maze';
import { MOVES } from './types';
import type { Access, Tile } from './types';

export function distanceField(m: Maze, from: Tile, access: Access): Int16Array {
  const dist = new Int16Array(m.cols * m.rows).fill(-1);
  if (!passable(m, from.col, from.row, access)) return dist;
  const queue: number[] = [from.row * m.cols + from.col];
  dist[queue[0] as number] = 0;
  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head] as number;
    const col = idx % m.cols;
    const row = (idx - col) / m.cols;
    const d = dist[idx] as number;
    for (const dir of MOVES) {
      if (!canMove(m, col, row, dir, access)) continue;
      const n = neighbor(m, col, row, dir);
      const ni = n.row * m.cols + n.col;
      if (dist[ni] === -1) {
        dist[ni] = d + 1;
        queue.push(ni);
      }
    }
  }
  return dist;
}

/** Memoises distance fields per (access, target). One cache per maze instance. */
export class DistCache {
  private readonly cache = new Map<string, Int16Array>();
  constructor(private readonly maze: Maze) {}
  field(target: Tile, access: Access): Int16Array {
    const key = `${access}:${target.col},${target.row}`;
    let f = this.cache.get(key);
    if (!f) {
      f = distanceField(this.maze, target, access);
      this.cache.set(key, f);
    }
    return f;
  }
  dist(target: Tile, from: Tile, access: Access): number {
    return this.field(target, access)[from.row * this.maze.cols + from.col] ?? -1;
  }
}

/** Returns a list of human-readable problems; empty means the maze is sound. */
export function validateMaze(m: Maze): string[] {
  const problems: string[] = [];
  const fromStart = distanceField(m, m.start, 'pip');
  for (let i = 0; i < m.items.length; i++) {
    const it = m.items[i];
    if ((it === ITEM_CRUMB || it === ITEM_SUGAR || it === ITEM_PISTOL) && fromStart[i] === -1) {
      problems.push(`item at ${i % m.cols},${Math.floor(i / m.cols)} is unreachable`);
    }
  }
  if (m.pistolCount !== 4) problems.push(`expected 4 water pistols, found ${m.pistolCount}`);
  if (m.tunnelRows.length < 1) problems.push('no tunnel row');
  if (m.basket.length < 3) problems.push('basket too small');
  const fromExit = distanceField(m, m.exit, 'cat');
  const fromCheese = fromStart[m.cheese.row * m.cols + m.cheese.col];
  if (fromCheese === -1) problems.push('cheese spot unreachable');
  for (const t of [...m.corners, ...m.route]) {
    if ((fromExit[t.row * m.cols + t.col] ?? -1) === -1) problems.push(`cat target ${t.col},${t.row} unreachable`);
  }
  const home = distanceField(m, m.door, 'home');
  for (const b of m.basket) if ((home[b.row * m.cols + b.col] ?? -1) === -1) problems.push('basket tile cut off');
  return problems;
}
