// Pure helpers for the cosmetic layers (kept DOM-free so they can be unit tested).
import type { Rating } from './rounds';

/** Keep a centred label of `width` fully inside [x0, x1], leaving `margin` at each edge. */
export function clampLabelX(x: number, width: number, x0: number, x1: number, margin: number): number {
  const half = width / 2 + margin;
  if (x1 - x0 <= half * 2) return (x0 + x1) / 2;
  return Math.min(x1 - half, Math.max(x0 + half, x));
}

/** Keep a label baseline at least `size` below the top edge. */
export const clampLabelY = (y: number, size: number, y0: number, margin: number): number => Math.max(y0 + size + margin, y);

/** Scatter `n` points inside a disc of `radius` (area-uniform) from a [0,1) random source. */
export function scatterInDisc(n: number, radius: number, rand: () => number): { dx: number; dy: number }[] {
  return Array.from({ length: n }, () => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
  });
}

/** Ghost positions behind a moving clay: `steps` points back along its velocity, `dt` seconds apart. */
export function trailPoints(x: number, y: number, vx: number, vy: number, steps: number, dt: number): { x: number; y: number; k: number }[] {
  return Array.from({ length: steps }, (_, i) => ({ x: x - vx * dt * (i + 1), y: y - vy * dt * (i + 1), k: 1 - (i + 1) / (steps + 1) }));
}

/** 0..5 stars for the results payoff. */
export const STARS: Record<Rating['id'], number> = { perfect: 5, ace: 4, marksman: 3, sporting: 2, novice: 1, bystander: 0 };
export const starsFor = (id: Rating['id']): number => STARS[id];

/** Tier name drives the card accent: gold / silver / bronze / plain. */
export function tierFor(id: Rating['id']): 'gold' | 'silver' | 'bronze' | 'plain' {
  const s = STARS[id];
  return s >= 4 ? 'gold' : s === 3 ? 'silver' : s >= 1 ? 'bronze' : 'plain';
}

/** Count-up value for the big hit number: eases to `target` over `ms`. */
export function countUp(target: number, elapsedMs: number, ms: number): number {
  if (ms <= 0 || elapsedMs >= ms) return target;
  const t = Math.max(0, elapsedMs) / ms;
  return Math.round(target * (1 - (1 - t) ** 3));
}
