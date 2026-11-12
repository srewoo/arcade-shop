// Per-level records. Stored as one JSON object; each level entry is validated alone.
import * as z from 'zod/mini';
import { readJson, writeJson } from './storage';
import type { Stars } from './scoring';

export const PROGRESS_KEY = 'kerbside-progress';
export const SEEN_KEY = 'kerbside-seen';

export const RecordSchema = z.strictObject({
  stars: z.int().check(z.gte(0), z.lte(3)),
  bestTime: z.number().check(z.gt(0), z.lte(3600)),
  bestDamage: z.int().check(z.gte(0), z.lte(99)),
  bestScore: z.int().check(z.gte(0), z.lte(100000)),
});
export interface LevelRecord {
  readonly stars: Stars;
  readonly bestTime: number;
  readonly bestDamage: number;
  readonly bestScore: number;
}
export type Progress = Readonly<Record<number, LevelRecord>>;

export function parseProgress(raw: unknown, levelCount: number): Progress {
  const out: Record<number, LevelRecord> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k);
    if (!Number.isInteger(id) || id < 1 || id > levelCount) continue;
    const r = z.safeParse(RecordSchema, v);
    if (r.success) out[id] = r.data as LevelRecord;
  }
  return out;
}

/** Merge a finished run into the record: best of each field. */
export function mergeRecord(prev: LevelRecord | undefined, run: { stars: Stars; time: number; damage: number; score: number }): LevelRecord {
  if (!prev) return { stars: run.stars, bestTime: run.time, bestDamage: run.damage, bestScore: run.score };
  return {
    stars: Math.max(prev.stars, run.stars) as Stars,
    bestTime: Math.min(prev.bestTime, run.time),
    bestDamage: Math.min(prev.bestDamage, run.damage),
    bestScore: Math.max(prev.bestScore, run.score),
  };
}

/** Level n is open when n is 1 or the previous level has at least one star. */
export const isUnlocked = (p: Progress, id: number): boolean => id <= 1 || (p[id - 1]?.stars ?? 0) >= 1;

export const totalStars = (p: Progress): number => Object.values(p).reduce((n, r) => n + r.stars, 0);

export const loadProgress = (levelCount: number): Progress => parseProgress(readJson(PROGRESS_KEY), levelCount);
export const saveProgress = (p: Progress): void => void writeJson(PROGRESS_KEY, p);
