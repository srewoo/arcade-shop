import { CONFIG } from './config';

export interface Tier { readonly min: number; readonly label: string; readonly rank: number }

/** Highest tier reached at `score`, or null below the first milestone. */
export function tierFor(score: number): Tier | null {
  let found: Tier | null = null;
  for (const t of CONFIG.tiers) if (score >= t.min) found = t;
  return found;
}

/** The tier whose milestone was crossed going from `prev` to `next` (null when none). */
export function tierCrossed(prev: number, next: number): Tier | null {
  let hit: Tier | null = null;
  for (const t of CONFIG.tiers) if (prev < t.min && next >= t.min) hit = t;
  return hit;
}

/** Next milestone above `score`, or null at the top. */
export function nextTier(score: number): Tier | null {
  return CONFIG.tiers.find((t) => t.min > score) ?? null;
}
