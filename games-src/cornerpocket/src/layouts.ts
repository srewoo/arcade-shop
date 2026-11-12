// Ball layouts: Rack Attack racks (seeded scatter), the 8-ball triangle, cue placement checks.
import { BALL_R, CUE_START, POCKETS, TABLE_H, TABLE_W } from './constants';
import { type Ball, makeBall } from './physics';
import { makeRng } from './rng';

const RACK_IDS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
export const rackBallCount = (rack: number): number => Math.min(3 + rack, 9);

/** True when (x,y) is on the table, outside every pocket mouth and clear of other balls. */
export function validSpot(balls: readonly Ball[], x: number, y: number, ignoreId = 0): boolean {
  if (x < BALL_R || x > TABLE_W - BALL_R || y < BALL_R || y > TABLE_H - BALL_R) return false;
  if (POCKETS.some((p) => Math.hypot(x - p.x, y - p.y) < p.r + BALL_R + 4)) return false;
  return !balls.some((b) => !b.pocketed && b.id !== ignoreId && Math.hypot(b.x - x, b.y - y) < 2 * BALL_R + 1);
}

/** Nearest free spot to the preferred point (spiral search). */
export function freeSpotNear(balls: readonly Ball[], px: number, py: number): { x: number; y: number } {
  if (validSpot(balls, px, py)) return { x: px, y: py };
  for (let r = 6; r < 400; r += 6) {
    for (let a = 0; a < 24; a++) {
      const x = px + Math.cos((a / 24) * Math.PI * 2) * r;
      const y = py + Math.sin((a / 24) * Math.PI * 2) * r;
      if (validSpot(balls, x, y)) return { x, y };
    }
  }
  return { x: px, y: py };
}

/** Deterministic scattered rack n (1-based). Cue ball is ball 0 at CUE_START. */
export function rackLayout(rack: number): Ball[] {
  const rng = makeRng(1000 + rack * 7919);
  const balls: Ball[] = [makeBall(0, CUE_START.x, CUE_START.y)];
  const count = rackBallCount(rack);
  let guard = 0;
  while (balls.length <= count && guard++ < 5000) {
    const x = 120 + rng() * (TABLE_W - 160);
    const y = 36 + rng() * (TABLE_H - 72);
    const nearCue = Math.hypot(x - CUE_START.x, y - CUE_START.y) < 60;
    if (!nearCue && validSpot(balls, x, y)) balls.push(makeBall(RACK_IDS[balls.length - 1]!, x, y));
  }
  return balls;
}

/** Standard 15-ball triangle, 8 in the middle, solids/stripes alternating on the corners. */
export function eightBallRack(): Ball[] {
  const balls: Ball[] = [makeBall(0, CUE_START.x, CUE_START.y)];
  const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  const gap = 2 * BALL_R + 0.3;
  const apexX = 540;
  let k = 0;
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      const x = apexX + row * gap * 0.866;
      const y = TABLE_H / 2 + (i - row / 2) * gap;
      balls.push(makeBall(order[k++]!, x, y));
    }
  }
  return balls;
}
