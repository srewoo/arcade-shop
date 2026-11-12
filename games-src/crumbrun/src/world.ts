// World state for one maze run, plus construction and small queries.
import { DistCache } from './graph';
import { MAZES } from './mazes';
import { newClock, newDrench } from './modes';
import type { Drench, ModeClock } from './modes';
import { mazeIndex, tuning } from './levels';
import type { Tuning } from './levels';
import { newScore } from './scoring';
import type { ScoreState } from './scoring';
import { CAT_KINDS, mulberry32 } from './types';
import type { CatKind, Dir, Rng, Tile } from './types';
import { newPounce } from './cats';
import type { CatBrain, PounceState } from './cats';
import type { Maze } from './maze';
import type { Mover, TurnBuffer } from './movement';

export type CatMode = 'house' | 'leaving' | 'active' | 'returning';

export interface Pip extends Mover, TurnBuffer {
  alive: boolean;
}

export interface Cat extends Mover {
  readonly kind: CatKind;
  readonly index: number;
  mode: CatMode;
  houseTimer: number;
  brain: CatBrain;
  /** Splashed during the current drench: not drenched again until it wears off. */
  immune: boolean;
  /** Tuxedo only: wind-up / dash / cooldown. `pouncing` is true only during the dash. */
  pounce: PounceState;
  pouncing: boolean;
}

export type EventType =
  | 'crumb' | 'sugar' | 'pistol' | 'splash' | 'cheese' | 'cheeseSpawn'
  | 'death' | 'clear' | 'extralife' | 'phase' | 'release' | 'drenchEnd' | 'drenchWarn' | 'pounce';

export interface GameEvent {
  readonly type: EventType;
  readonly points?: number;
  readonly cat?: CatKind;
  readonly at?: Tile;
}

export interface Stats {
  crumbs: number;
  splashes: number;
  cheese: number;
  /** Longest splash chain in one drench. */
  bestChain: number;
  drenches: number;
}

export interface World {
  readonly maze: Maze;
  readonly dists: DistCache;
  readonly rng: Rng;
  readonly level: number;
  readonly tuning: Tuning;
  readonly pip: Pip;
  readonly cats: Cat[];
  readonly items: Uint8Array;
  remaining: number;
  score: ScoreState;
  drench: Drench;
  clock: ModeClock;
  cheese: { active: boolean; left: number };
  cheeseSpawned: number;
  time: number;
  stats: Stats;
  events: GameEvent[];
  cleared: boolean;
  god: boolean;
  ai: boolean;
}

export interface WorldOptions {
  readonly seed?: number;
  readonly ai?: boolean;
  readonly score?: ScoreState;
  readonly maze?: Maze;
}

export function basketCenter(maze: Maze): Tile {
  return { col: maze.door.col, row: maze.door.row + 1 };
}

function makeCat(maze: Maze, kind: CatKind, index: number, delay: number): Cat {
  const out = index === 0;
  const slots: Tile[] = [maze.exit, { col: 9, row: 11 }, { col: 10, row: 11 }, { col: 11, row: 11 }];
  const t = slots[index] as Tile;
  return {
    kind, index, x: t.col, y: t.row, px: t.col, py: t.row, dir: out ? 'L' : 'N',
    mode: out ? 'active' : 'house', houseTimer: delay,
    brain: { routeIdx: 0, chaseTimer: 0 }, immune: false, pounce: newPounce(), pouncing: false,
  };
}

export function createWorld(level: number, opts: WorldOptions = {}): World {
  const maze = opts.maze ?? (MAZES[mazeIndex(level)] as Maze);
  const tune = tuning(level);
  return {
    maze, dists: new DistCache(maze), rng: mulberry32(opts.seed ?? 1234 + level), level, tuning: tune,
    pip: { x: maze.start.col, y: maze.start.row, px: maze.start.col, py: maze.start.row,
      dir: 'N' as Dir, want: 'N' as Dir, alive: true },
    cats: CAT_KINDS.map((k, i) => makeCat(maze, k, i, tune.releaseDelays[i] ?? 0)),
    items: maze.items.slice(), remaining: maze.edibleCount,
    score: opts.score ?? newScore(), drench: newDrench(), clock: newClock(),
    cheese: { active: false, left: 0 }, cheeseSpawned: 0, time: 0,
    stats: { crumbs: 0, splashes: 0, cheese: 0, bestChain: 0, drenches: 0 }, events: [], cleared: false,
    god: false, ai: opts.ai ?? false,
  };
}

export function tileOf(m: Mover, maze: Maze): Tile {
  return {
    col: Math.min(maze.cols - 1, Math.max(0, Math.round(m.x))),
    row: Math.round(m.y),
  };
}

/** Active cats sit still and groom during the rest phase; touching one is harmless. */
export function isGrooming(w: World, cat: Cat): boolean {
  return cat.mode === 'active' && cat.dir === 'N' && w.clock.phase === 'rest' && !isDrenched(w, cat);
}

/** A cat is drenched while the window is open, unless it is still home or already splashed. */
export function isDrenched(w: World, cat: Cat): boolean {
  return w.drench.left > 0 && !cat.immune && (cat.mode === 'active' || cat.mode === 'leaving');
}

/** After a death: Pip and the cats go back to their starting spots; the maze keeps its crumbs. */
export function respawn(w: World): void {
  const fresh = createWorld(w.level, { maze: w.maze });
  Object.assign(w.pip, fresh.pip);
  w.cats.forEach((c, i) => Object.assign(c, fresh.cats[i]));
  w.drench = fresh.drench;
  w.clock = fresh.clock;
  w.cheese = { active: false, left: 0 };
  w.events.length = 0;
}
