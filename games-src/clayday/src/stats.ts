// Lifetime stats (best score, furthest round) with per-field zod fallback.
import * as z from 'zod/mini';
import { readJson, writeJson } from './storage';

export const STATS_KEY = 'clayday-stats';

const count = z.int().check(z.gte(0), z.lte(100_000_000));

export const StatsSchema = z.strictObject({
  bestRun: count,
  bestRound: count,
  bestHits: z.int().check(z.gte(0), z.lte(100)),
  roundsPlayed: count,
});
export type Stats = z.infer<typeof StatsSchema>;

export const DEFAULT_STATS: Readonly<Stats> = Object.freeze({ bestRun: 0, bestRound: 0, bestHits: 0, roundsPlayed: 0 });

export function parseStats(raw: unknown): Stats {
  const out: Record<string, unknown> = { ...DEFAULT_STATS };
  if (typeof raw !== 'object' || raw === null) return out as Stats;
  for (const key of Object.keys(StatsSchema.shape) as (keyof Stats)[]) {
    const parsed = z.safeParse(StatsSchema.shape[key], (raw as Record<string, unknown>)[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  return out as Stats;
}

export interface RunEnd {
  readonly runScore: number;
  readonly round: number;
  readonly bestRoundHits: number;
  readonly counted: boolean;
}

/** Fold a finished round into the stats. Practice rounds only bump roundsPlayed. */
export function recordRound(prev: Stats, end: RunEnd): Stats {
  return {
    roundsPlayed: prev.roundsPlayed + 1,
    bestRun: end.counted ? Math.max(prev.bestRun, end.runScore) : prev.bestRun,
    bestRound: end.counted ? Math.max(prev.bestRound, end.round) : prev.bestRound,
    bestHits: end.counted ? Math.max(prev.bestHits, end.bestRoundHits) : prev.bestHits,
  };
}

export const loadStats = (): Stats => parseStats(readJson(STATS_KEY));
export const saveStats = (s: Stats): void => void writeJson(STATS_KEY, s);
