// The mutable simulation state the sub-steppers (falling, feeder, sliding) share.
import type { Rng } from '../rng';
import type { Cells, Kind, SimEvent, Tile } from './types';

export interface World {
  cells: Cells;
  /** Every live tile (queued, resting, falling, sliding). */
  all: Tile[];
  events: SimEvent[];
  rng: Rng;
  nextId: number;
  /** Bumped whenever the resting grid changes (cache key for the hover preview). */
  version: number;
}

export function makeTile(w: World, kind: Kind, col: number, row: number): Tile {
  return { id: w.nextId++, kind, col, row, x: col, y: row, px: col, py: row, vy: 0, state: 'rest', age: 0, squash: 0, hold: 0, impact: 0, fresh: false };
}

export function removeFrom(list: Tile[], t: Tile): void {
  const i = list.indexOf(t);
  if (i < 0) return;
  list[i] = list[list.length - 1] as Tile;
  list.pop();
}
