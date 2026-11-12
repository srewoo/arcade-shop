// Ghost path of a shot with no pins, for the aim/hook guide. Pure.
import { PIT_Y } from './constants';
import { createWorld, stepWorld } from './physics';
import type { Shot } from './worldTypes';

export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

const NO_PINS: readonly boolean[] = Array.from({ length: 10 }, () => false);

/** Ball positions roughly every `every` steps until it reaches `untilY`. */
export function previewPath(shot: Shot, untilY = PIT_Y - 60, every = 8): PathPoint[] {
  const w = createWorld(NO_PINS, shot);
  const pts: PathPoint[] = [{ x: w.ball.x, y: w.ball.y }];
  for (let i = 1; w.ball.active && w.ball.y < untilY && !w.ball.inGutter && i < 2000; i++) {
    stepWorld(w);
    if (i % every === 0) pts.push({ x: w.ball.x, y: w.ball.y });
  }
  pts.push({ x: w.ball.x, y: w.ball.y });
  return pts;
}
