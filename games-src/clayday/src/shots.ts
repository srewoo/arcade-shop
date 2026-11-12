// Pellet resolution: a shot lands at its aim point after a short delay, so the
// player has to lead a moving clay. Every flying clay inside the pattern breaks.
import type { Clay } from './clay';

export interface Shot {
  readonly x: number;
  readonly y: number;
  age: number;
}

/** Clays caught by a shot's pellet pattern (flying only), nearest first. */
export function claysInPattern(shot: Pick<Shot, 'x' | 'y'>, clays: readonly Clay[], spread: number): Clay[] {
  const hit: { clay: Clay; d: number }[] = [];
  for (const clay of clays) {
    if (clay.state !== 'flying') continue;
    const d = Math.hypot(clay.x - shot.x, clay.y - shot.y);
    if (d <= clay.radius + spread) hit.push({ clay, d });
  }
  return hit.sort((a, b) => a.d - b.d).map((h) => h.clay);
}
