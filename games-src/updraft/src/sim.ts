// Fixed-timestep simulation of one craft. Pure and deterministic: same world + same
// inputs per tick always give the same state.
import { CONFIG } from './config';
import type { World } from './world';

const C = CONFIG.craft;

export interface SimState {
  tick: number;
  dist: number;
  prevDist: number;
  y: number;
  prevY: number;
  vy: number;
  coinCount: number;
  readonly taken: Set<number>;
  alive: boolean;
  /** True when the last step collected at least one coin. */
  gotCoin: boolean;
}

export function newSim(): SimState {
  const y = CONFIG.world.height / 2;
  return { tick: 0, dist: 0, prevDist: 0, y, prevY: y, vy: 0, coinCount: 0, taken: new Set(), alive: true, gotCoin: false };
}

export const speedAt = (dist: number): number => Math.min(CONFIG.speed.max, CONFIG.speed.start + CONFIG.speed.perUnit * dist);
export const metres = (s: SimState): number => Math.floor(s.dist / CONFIG.score.unitsPerMetre);
export const scoreOf = (s: SimState): number => metres(s) + s.coinCount * CONFIG.score.coinValue;

/** Does a craft circle at (x, y) touch rock? */
export function collides(world: World, x: number, y: number, r: number = C.radius): boolean {
  for (let i = -2; i <= 2; i++) {
    const dx = (i * r) / 2;
    const h = Math.sqrt(r * r - dx * dx);
    if (y - h < world.ceilAt(x + dx) || y + h > world.floorAt(x + dx)) return true;
  }
  for (const o of world.obstaclesIn(x - r, x + r)) {
    const nx = Math.max(o.x, Math.min(x, o.x + o.w));
    const ny = Math.max(o.y0, Math.min(y, o.y1));
    if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
  }
  return false;
}

function collect(world: World, s: SimState): void {
  const reach = C.radius + CONFIG.world.coinR;
  for (const coin of world.coinsIn(s.dist - reach, s.dist + reach)) {
    if (s.taken.has(coin.id)) continue;
    if ((coin.x - s.dist) ** 2 + (coin.y - s.y) ** 2 <= reach * reach) {
      s.taken.add(coin.id);
      s.coinCount++;
      s.gotCoin = true;
    }
  }
}

/** Advance one fixed tick. `hold` is whether the rise input is down for this tick. */
export function stepSim(world: World, s: SimState, hold: boolean): void {
  if (!s.alive) return;
  s.prevDist = s.dist;
  s.prevY = s.y;
  s.gotCoin = false;
  const dt = CONFIG.sim.dt;
  s.vy = Math.max(-C.maxVy, Math.min(C.maxVy, s.vy + (hold ? -C.thrust : C.gravity) * dt));
  s.y += s.vy * dt;
  s.dist += speedAt(s.dist) * dt;
  s.tick++;
  if (collides(world, s.dist, s.y)) {
    s.alive = false;
    return;
  }
  collect(world, s);
}
