// Demo "AI" for the attract screen. Greedy BFS to the nearest reward while
// keeping a safety margin around hunting cats; chases cats while drenched.
import { canMove, neighbor } from './maze';
import { MOVES } from './types';
import type { Dir, MoveDir, Tile } from './types';
import { isDrenched, tileOf } from './world';
import type { World } from './world';

const SAFE_RADIUS = 3;

function dangerSet(w: World): Set<number> {
  const bad = new Set<number>();
  for (const c of w.cats) {
    if (c.mode !== 'active' || isDrenched(w, c)) continue;
    const field = w.dists.field(tileOf(c, w.maze), 'cat');
    field.forEach((d, i) => {
      if (d >= 0 && d <= SAFE_RADIUS) bad.add(i);
    });
  }
  return bad;
}

function rewardSet(w: World): Set<number> {
  const goals = new Set<number>();
  w.items.forEach((it, i) => {
    if (it !== 0) goals.add(i);
  });
  if (w.cheese.active) goals.add(w.maze.cheese.row * w.maze.cols + w.maze.cheese.col);
  if (w.drench.left > 2) {
    for (const c of w.cats) if (isDrenched(w, c)) {
      const t = tileOf(c, w.maze);
      goals.add(t.row * w.maze.cols + t.col);
    }
  }
  return goals;
}

function bfsFirstStep(w: World, from: Tile, bad: Set<number>, goals: Set<number>): Dir {
  const { maze } = w;
  const seen = new Set<number>([from.row * maze.cols + from.col]);
  const queue: { t: Tile; first: MoveDir }[] = [];
  const push = (t: Tile, first: MoveDir | null, d: MoveDir): void => {
    const n = neighbor(maze, t.col, t.row, d);
    const idx = n.row * maze.cols + n.col;
    if (seen.has(idx) || bad.has(idx) || !canMove(maze, t.col, t.row, d, 'pip')) return;
    seen.add(idx);
    queue.push({ t: n, first: first ?? d });
  };
  for (const d of MOVES) push(from, null, d);
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head] as { t: Tile; first: MoveDir };
    if (goals.has(cur.t.row * maze.cols + cur.t.col)) return cur.first;
    for (const d of MOVES) push(cur.t, cur.first, d);
  }
  return 'N';
}

function bestEscape(w: World, at: Tile): Dir {
  let best: Dir = 'N';
  let bestScore = -1;
  for (const d of MOVES) {
    if (!canMove(w.maze, at.col, at.row, d, 'pip')) continue;
    const n = neighbor(w.maze, at.col, at.row, d);
    let nearest = 99;
    for (const c of w.cats) {
      if (c.mode !== 'active') continue;
      const dist = w.dists.dist(tileOf(c, w.maze), n, 'cat');
      if (dist >= 0) nearest = Math.min(nearest, dist);
    }
    if (nearest > bestScore) {
      bestScore = nearest;
      best = d;
    }
  }
  return best;
}

/** Direction the demo Pip wants to take from tile `at`. */
export function demoWant(w: World, at: Tile): Dir {
  const bad = dangerSet(w);
  const dir = bfsFirstStep(w, at, bad, rewardSet(w));
  return dir === 'N' ? bestEscape(w, at) : dir;
}
