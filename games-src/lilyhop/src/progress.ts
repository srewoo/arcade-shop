// Saved results per level. Each stored record is validated field by field.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { LEVELS } from './levels';
import { readJson, writeJson } from './storage';

const Stars = z.int().check(z.gte(1), z.lte(3));
const Count = z.int().check(z.gte(0), z.lte(1_000_000_000));
const DateKey = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export interface LevelRecord {
  readonly stars: 1 | 2 | 3;
  readonly bestMoves: number;
  readonly bestMs: number;
}
export interface DailyRecord extends LevelRecord {
  readonly date: string;
}
export interface Progress {
  readonly levels: Readonly<Record<string, LevelRecord>>;
  readonly daily?: DailyRecord;
}

const field = <T>(schema: z.ZodMiniType<T>, v: unknown, fallback: T): T => {
  const r = z.safeParse(schema, v);
  return r.success ? r.data : fallback;
};

function parseRecord(raw: unknown): LevelRecord | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const stars = z.safeParse(Stars, r.stars);
  if (!stars.success) return undefined;
  return {
    stars: stars.data as 1 | 2 | 3,
    bestMoves: field(Count, r.bestMoves, 0),
    bestMs: field(Count, r.bestMs, 0),
  };
}

export function parseProgress(raw: unknown): Progress {
  if (typeof raw !== 'object' || raw === null) return { levels: {} };
  const src = raw as Record<string, unknown>;
  const levels: Record<string, LevelRecord> = {};
  const stored = typeof src.levels === 'object' && src.levels !== null ? (src.levels as Record<string, unknown>) : {};
  for (const level of LEVELS) {
    const rec = parseRecord(stored[level.id]);
    if (rec) levels[level.id] = rec;
  }
  const dailyRec = parseRecord(src.daily);
  const date = z.safeParse(DateKey, (src.daily as Record<string, unknown> | undefined)?.date);
  return dailyRec && date.success ? { levels, daily: { ...dailyRec, date: date.data } } : { levels };
}

export const loadProgress = (): Progress => parseProgress(readJson(CONFIG.keys.progress));
export const saveProgress = (p: Progress): void => void writeJson(CONFIG.keys.progress, p);

/** Merge a finished run; best values only improve. Returns whether it was a new best. */
export function recordResult(
  p: Progress, id: string, moves: number, ms: number, stars: 1 | 2 | 3, date?: string,
): { progress: Progress; improved: boolean } {
  const prev = date ? (p.daily?.date === date ? p.daily : undefined) : p.levels[id];
  const better = (a: number, b: number): number => (a > 0 && a <= b ? a : b);
  const next: LevelRecord = {
    stars: Math.max(prev?.stars ?? 1, stars) as 1 | 2 | 3,
    bestMoves: prev ? better(prev.bestMoves, moves) : moves,
    bestMs: prev ? better(prev.bestMs, ms) : ms,
  };
  const improved = !prev || next.stars > prev.stars || next.bestMoves < prev.bestMoves;
  if (date) return { progress: { ...p, daily: { ...next, date } }, improved };
  return { progress: { ...p, levels: { ...p.levels, [id]: next } }, improved };
}

/** A level is open when it opens its group, or the one before it has been finished. */
export function isUnlocked(p: Progress, id: string): boolean {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i <= 0) return i === 0;
  const prev = LEVELS[i - 1];
  const here = LEVELS[i];
  if (prev && here && prev.group !== here.group) return true;
  return prev !== undefined && p.levels[prev.id] !== undefined;
}

export function nextLevelId(id: string): string | undefined {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 ? LEVELS[i + 1]?.id : undefined;
}
