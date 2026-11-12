// Lifetime stats (games, best, strikes, spares) and spare-challenge stars. Pure plus zod-validated storage.
import { z } from 'zod';
import { scoreGame } from './scoring';
import { readJson, writeJson } from './storage';
import { TUNING } from './tuning';

const STATS_KEY = 'luckylanes-stats';

const count = z.number().int().min(0).max(10_000_000);
export const StatsSchema = z.object({ games: count, best: z.number().int().min(0).max(300), strikes: count, spares: count, gutters: count }).strict();
export type Stats = z.infer<typeof StatsSchema>;

export const emptyStats = (): Stats => ({ games: 0, best: 0, strikes: 0, spares: 0, gutters: 0 });

/** Keep each valid field, zero the rest. */
export function parseStats(raw: unknown): Stats {
  const out = emptyStats();
  if (typeof raw !== 'object' || raw === null) return out;
  for (const key of Object.keys(out) as (keyof Stats)[]) {
    const p = StatsSchema.shape[key].safeParse((raw as Record<string, unknown>)[key]);
    if (p.success) out[key] = p.data;
  }
  return out;
}

export interface GameTally {
  readonly strikes: number;
  readonly spares: number;
  readonly gutters: number;
}

/** Strikes, spares and gutter balls in one bowling game's roll list. */
export function tallyRolls(rolls: readonly number[]): GameTally {
  const symbols = scoreGame(rolls).flatMap((f) => f.symbols);
  return {
    strikes: symbols.filter((s) => s === 'X').length,
    spares: symbols.filter((s) => s === '/').length,
    gutters: rolls.filter((r) => r === 0).length,
  };
}

export function recordGame(stats: Stats, score: number, tally: GameTally): Stats {
  return {
    games: stats.games + 1,
    best: Math.max(stats.best, Math.min(300, Math.max(0, Math.round(score)))),
    strikes: stats.strikes + tally.strikes,
    spares: stats.spares + tally.spares,
    gutters: stats.gutters + tally.gutters,
  };
}

/** 0-3 stars for a spare-challenge score. */
export const spareStars = (score: number): number => TUNING.stats.spareStars.filter((t) => score >= t).length;

export const loadStats = (): Stats => parseStats(readJson(STATS_KEY));
export const saveStats = (s: Stats): void => writeJson(STATS_KEY, s);
