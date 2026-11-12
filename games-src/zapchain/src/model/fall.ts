// Gravity for tiles in flight (released by a zap, or fresh from the feeder) and the
// sideways slide of base-row compaction.
import { CONFIG } from '../config';
import { compactShifts, restRow } from './grid';
import type { Tile } from './types';
import { removeFrom, type World } from './world';

export interface FallProfile { readonly g: number; readonly v0: number; readonly vMax: number }

/** Start a tile falling. */
export function release(t: Tile, profile: FallProfile): void {
  t.state = 'fall';
  t.vy = profile.v0;
}

/**
 * Advance falling tiles one step. Returns the tiles that landed and whether one reached the
 * spawn row (a full column). Tiles are processed lowest first so stacks settle in order.
 */
export function stepFall(w: World, list: Tile[], profile: FallProfile, dt: number): { landed: Tile[]; overflow: boolean } {
  const landed: Tile[] = [];
  list.sort((a, b) => b.y - a.y);
  for (const t of [...list]) {
    t.px = t.x;
    t.py = t.y;
    if (t.hold > 0) { t.hold = Math.max(0, t.hold - dt); continue; }
    t.vy = Math.min(profile.vMax, t.vy + profile.g * dt);
    t.y += t.vy * dt;
    const target = restRow(w.cells, t.col, t.y);
    if (target <= 0) return { landed, overflow: true };
    if (t.y < target) continue;
    land(w, t, target);
    removeFrom(list, t);
    landed.push(t);
  }
  return { landed, overflow: false };
}

function land(w: World, t: Tile, row: number): void {
  const speed = t.vy;
  t.y = row;
  t.py = row;
  t.row = row;
  t.state = 'rest';
  t.squash = CONFIG.fx.squashSec;
  t.impact = Math.min(1, speed / 14);
  (w.cells[row] as (Tile | null)[])[t.col] = t;
  w.version++;
  w.events.push({ t: 'land', col: t.col, row, fresh: t.fresh, speed });
  t.fresh = false;
}

/** Plan and start the base-row compaction. Returns the tiles that begin sliding. */
export function startSlides(w: World): Tile[] {
  const floor = CONFIG.grid.floorRow;
  const base = (w.cells[floor] as (Tile | null)[]).map((t) => t !== null);
  const shifts = compactShifts(base);
  const moving: Tile[] = [];
  for (let c = 0; c < CONFIG.grid.cols; c++) {
    if (shifts[c] === 0) continue;
    for (let r = 1; r <= floor; r++) {
      const t = w.cells[r]?.[c];
      if (!t) continue;
      (w.cells[r] as (Tile | null)[])[c] = null;
      moving.push(t);
    }
  }
  for (const t of moving) {
    t.col += shifts[t.col] ?? 0;
    t.state = 'slide';
    (w.cells[t.row] as (Tile | null)[])[t.col] = t;
  }
  if (moving.length > 0) { w.version++; w.events.push({ t: 'slide' }); }
  return moving;
}

/** Move sliding tiles towards their column; returns true while any is still moving. */
export function stepSlide(list: Tile[], dt: number): boolean {
  const stride = CONFIG.fall.slideSpeed * dt;
  for (const t of [...list]) {
    t.px = t.x;
    const d = t.col - t.x;
    if (Math.abs(d) <= stride) {
      t.x = t.col;
      t.state = 'rest';
      removeFrom(list, t);
    } else t.x += Math.sign(d) * stride;
  }
  return list.length > 0;
}
