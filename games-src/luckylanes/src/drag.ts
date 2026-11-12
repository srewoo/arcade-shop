// Drag-to-throw: converts a pointer path (screen px) into a shot. Pure.
import { MAX_AIM } from './constants';
import { clamp } from './rng';
import type { Shot } from './worldTypes';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const MIN_DRAG_PX = 40;
const MAX_DRAG_ANGLE = Math.PI / 6;

/**
 * Drag up the screen to throw. Length sets power, direction sets aim and a
 * bowed path sets the hook. `refPx` is the drag length that means full power.
 */
export function shotFromDrag(path: readonly Point[], refPx: number, startX: number): Shot | null {
  const a = path[0];
  const b = path[path.length - 1];
  if (!a || !b || path.length < 2) return null;
  const dx = b.x - a.x;
  const dy = a.y - b.y;
  const len = Math.hypot(dx, dy);
  if (len < MIN_DRAG_PX || dy < MIN_DRAG_PX * 0.5) return null;
  const power = clamp(0.25 + 0.75 * (len / refPx), 0.25, 1);
  const aim = clamp((Math.atan2(dx, dy) / MAX_DRAG_ANGLE) * MAX_AIM, -MAX_AIM, MAX_AIM);
  return { x: startX, aim, power, spin: clamp(bow(path, len) / (len * 0.2), -1, 1) };
}

/**
 * Signed sideways bow (px) of the path's farthest point from the chord.
 * A path that bows left and ends right curves right, so it counts as positive.
 */
function bow(path: readonly Point[], len: number): number {
  const a = path[0] as Point;
  const b = path[path.length - 1] as Point;
  let best = 0;
  for (const p of path) {
    const right = ((p.x - a.x) * (a.y - b.y) + (p.y - a.y) * (b.x - a.x)) / len;
    if (Math.abs(right) > Math.abs(best)) best = right;
  }
  return 0 - best;
}
