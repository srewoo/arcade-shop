// Campaign progress: best stars and fewest moves per level, validated per entry.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const PROGRESS_KEY = 'measureup-progress';
export const ONBOARD_KEY = 'measureup-onboarded';

const BestSchema = z.strictObject({
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  moves: z.int().check(z.gte(1), z.lte(9999)),
});
export type Best = z.infer<typeof BestSchema>;
export type Progress = Readonly<Record<number, Best>>;

/** Keep each valid entry for a known level id; drop the rest. */
export function parseProgress(raw: unknown, levelCount: number): Progress {
  const out: Record<number, Best> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (let id = 1; id <= levelCount; id++) {
    const parsed = z.safeParse(BestSchema, (raw as Record<string, unknown>)[String(id)]);
    if (parsed.success) out[id] = parsed.data;
  }
  return out;
}

/** Record a finished level; keeps the better stars, then the fewer moves. */
export function recordBest(p: Progress, id: number, stars: Best['stars'], moves: number): Progress {
  const old = p[id];
  const better = !old || stars > old.stars || (stars === old.stars && moves < old.moves);
  return better ? { ...p, [id]: { stars, moves } } : p;
}

/** Highest level id that can be opened: first unfinished level plus a few ahead. */
export function unlockedUpTo(p: Progress, levelCount: number): number {
  let firstOpen = 1;
  while (firstOpen <= levelCount && p[firstOpen]) firstOpen++;
  return Math.min(levelCount, firstOpen + CONFIG.progress.unlockAhead);
}

export const totalStars = (p: Progress): number => Object.values(p).reduce((sum, b) => sum + b.stars, 0);

export const loadProgress = (levelCount: number): Progress => parseProgress(readJson(PROGRESS_KEY), levelCount);
export const saveProgress = (p: Progress): void => void writeJson(PROGRESS_KEY, p);
