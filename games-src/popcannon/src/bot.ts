// Pure greedy player used by the debug hook, balance tests and the puzzle solver. No DOM.
import { MAX_ANGLE, traceShot } from './aim';
import { Bubble, Grid, Pos, getCell, landingCell, setCell } from './hex';
import { bombCells, floodMatch, matchGroup, trimRows } from './match';
import { aim, fire, swap } from './shoot';
import { Game } from './state';
import { STEP, update } from './update';

/** Cell a shot at `angle` would land in on `grid`, or null. */
export function landingFor(grid: Grid, angle: number): Pos | null {
  const end = traceShot(grid, angle, 8).end;
  return landingCell(grid, end.x, end.y);
}

/** How many bubbles `b` would pop if it landed at `pos` (grid is restored afterwards). */
export function popCount(grid: Grid, pos: Pos, b: Bubble): number {
  setCell(grid, pos.row, pos.col, b);
  const n = b.kind === 'bomb' ? bombCells(grid, pos).length : matchGroup(grid, pos).length;
  let near = 0;
  if (n === 0 && b.kind === 'normal') near = floodMatch(grid, pos, b.color).length;
  setCell(grid, pos.row, pos.col, null);
  trimRows(grid);
  return n > 0 ? n : near * 0.1;
}

const toRad = (deg: number): number => (Math.min(78, Math.abs(deg)) * Math.sign(deg) * Math.PI) / 180;

/** Angle (radians) and score of the best landing for bubble `b`. */
export function bestShot(g: Game, b: Bubble): { angle: number; score: number } {
  let best = { angle: 0, score: -1 };
  for (let deg = -78; deg <= 78; deg += 1) {
    const a = toRad(deg);
    const pos = landingFor(g.grid, a);
    if (!pos || getCell(g.grid, pos.row, pos.col)) continue;
    const score = popCount(g.grid, pos, b);
    if (score > best.score) best = { angle: a, score };
  }
  return { angle: Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, best.angle)), score: best.score };
}

/** Best angle for the current bubble only. */
export function bestAngle(g: Game): number {
  return g.cur ? bestShot(g, g.cur).angle : 0;
}

/** Greedy move that also considers swapping current and next. */
export function skilledMove(g: Game): { swap: boolean; angle: number } {
  const a = g.cur ? bestShot(g, g.cur) : { angle: 0, score: -1 };
  const b = g.next ? bestShot(g, g.next) : { angle: 0, score: -1 };
  return b.score > a.score ? { swap: true, angle: b.angle } : { swap: false, angle: a.angle };
}

/** Run the simulation until the ball has landed (or `maxSeconds` pass). */
export function settle(g: Game, maxSeconds = 8): void {
  for (let i = 0; i < maxSeconds / STEP && g.ball; i++) {
    update(g, STEP, { left: false, right: false });
  }
}

/** Play one shot with the skilled greedy policy. Returns false if no shot was possible. */
export function playSkilled(g: Game): boolean {
  const m = skilledMove(g);
  if (m.swap) swap(g);
  aim(g, m.angle);
  const ok = fire(g);
  settle(g);
  return ok;
}

/** Play one shot with a random angle drawn from `rnd`. */
export function playRandom(g: Game, rnd: () => number): boolean {
  aim(g, toRad((rnd() * 2 - 1) * 75));
  const ok = fire(g);
  settle(g);
  return ok;
}
