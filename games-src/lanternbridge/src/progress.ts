// Per-level best results. Stored as { v: 1, levels: { id: { stars, best } } };
// each entry is validated on its own so one bad row never wipes the rest.
import * as z from 'zod/mini';
import { CONFIG, STORAGE_KEYS } from './config';
import { readJson, writeJson } from './storage';

export const EntrySchema = z.strictObject({
  stars: z.int().check(z.gte(1), z.lte(CONFIG.rating.maxStars)),
  best: z.int().check(z.gte(0), z.lte(9999)),
});
export type Entry = z.infer<typeof EntrySchema>;
export type Progress = Readonly<Record<string, Entry>>;

const ID_PATTERN = /^[a-z0-9-]{1,32}$/;

export function parseProgress(raw: unknown): Progress {
  const out: Record<string, Entry> = {};
  const levels = typeof raw === 'object' && raw !== null ? (raw as { levels?: unknown }).levels : null;
  if (typeof levels !== 'object' || levels === null) return out;
  for (const [id, value] of Object.entries(levels)) {
    const parsed = z.safeParse(EntrySchema, value);
    if (ID_PATTERN.test(id) && parsed.success) out[id] = parsed.data;
  }
  return out;
}

/** Keep the newest daily entries only (ids sort by date), plus every non-daily row. */
export function pruneDaily(progress: Progress, keep: number): Progress {
  const dailies = Object.keys(progress).filter((k) => k.startsWith('daily-')).sort();
  const drop = new Set(dailies.slice(0, Math.max(0, dailies.length - keep)));
  return Object.fromEntries(Object.entries(progress).filter(([k]) => !drop.has(k)));
}

/** Record a result; keeps the better star count, and the lower cost on ties. */
export function recordResult(progress: Progress, id: string, stars: number, cost: number): Progress {
  const old = progress[id];
  const better = !old || stars > old.stars || (stars === old.stars && cost < old.best);
  if (!better) return progress;
  return pruneDaily({ ...progress, [id]: { stars, best: cost } }, CONFIG.ui.dailyKeep);
}

export const totalStars = (progress: Progress, ids: readonly string[]): number =>
  ids.reduce((sum, id) => sum + (progress[id]?.stars ?? 0), 0);

export const loadProgress = (): Progress => parseProgress(readJson(STORAGE_KEYS.progress));
export const saveProgress = (p: Progress): void => void writeJson(STORAGE_KEYS.progress, { v: 1, levels: p });
