// Best scores per mode and per daily puzzle date. Validated field by field.
import * as z from 'zod/mini';
import { CONFIG, type ModeId } from './config';
import { readJson, writeJson } from './storage';

export const STATS_KEY = 'tt-stats';

const Score = z.int().check(z.gte(0), z.lte(1_000_000));
const DateKey = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export interface Stats {
  readonly best: Readonly<Record<'classic' | 'moves' | 'endless', number>>;
  readonly daily: Readonly<Record<string, number>>;
  readonly played: number;
}
export const EMPTY_STATS: Stats = { best: { classic: 0, moves: 0, endless: 0 }, daily: {}, played: 0 };

const num = (v: unknown): number | undefined => {
  const r = z.safeParse(Score, v);
  return r.success ? r.data : undefined;
};
const obj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {});

export function parseStats(raw: unknown): Stats {
  const root = obj(raw);
  const best = obj(root.best);
  const daily: Record<string, number> = {};
  for (const [key, value] of Object.entries(obj(root.daily))) {
    const score = num(value);
    if (z.safeParse(DateKey, key).success && score !== undefined) daily[key] = score;
  }
  return {
    best: {
      classic: num(best.classic) ?? 0,
      moves: num(best.moves) ?? 0,
      endless: num(best.endless) ?? 0,
    },
    daily: pruneDaily(daily),
    played: num(root.played) ?? 0,
  };
}

function pruneDaily(daily: Record<string, number>): Record<string, number> {
  const keys = Object.keys(daily).sort().slice(-CONFIG.stats.dailyKeep);
  return Object.fromEntries(keys.map((k) => [k, daily[k] as number]));
}

export const loadStats = (): Stats => parseStats(readJson(STATS_KEY));
export const saveStats = (s: Stats): void => void writeJson(STATS_KEY, s);

export const bestFor = (s: Stats, mode: ModeId, today: string): number => (mode === 'daily' ? (s.daily[today] ?? 0) : s.best[mode]);

/** Fold a finished game in; reports whether it set a new best (and beat a real one). */
export function recordResult(s: Stats, mode: ModeId, score: number, today: string): { stats: Stats; newBest: boolean } {
  const prior = bestFor(s, mode, today);
  const newBest = score > prior;
  const top = Math.max(score, prior);
  const base = { ...s, played: s.played + 1 };
  if (mode === 'daily') return { stats: { ...base, daily: pruneDaily({ ...s.daily, [today]: top }) }, newBest };
  return { stats: { ...base, best: { ...s.best, [mode]: top } }, newBest };
}
