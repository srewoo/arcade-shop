// Scoreboard + streak persistence. Writes re-read the stored value first so two
// open tabs add to each other's totals instead of overwriting them.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const SCORES_KEY = 'ttt-scores';
export const STATS_KEY = 'ttt-stats';

const Count = z.int().check(z.gte(0), z.lte(1_000_000));
export const ScoresSchema = z.strictObject({ X: Count, O: Count, draw: Count });
export type Scores = z.infer<typeof ScoresSchema>;
export const EMPTY_SCORES: Readonly<Scores> = Object.freeze({ X: 0, O: 0, draw: 0 });

export const StatsSchema = z.strictObject({ streak: Count, best: Count });
export type Stats = z.infer<typeof StatsSchema>;
export const EMPTY_STATS: Readonly<Stats> = Object.freeze({ streak: 0, best: 0 });

export type Outcome = 'win' | 'loss' | 'draw';

export function parseScores(raw: unknown): Scores {
  const parsed = z.safeParse(ScoresSchema, raw);
  return parsed.success ? parsed.data : { ...EMPTY_SCORES };
}

export function parseStats(raw: unknown): Stats {
  const parsed = z.safeParse(StatsSchema, raw);
  return parsed.success ? parsed.data : { ...EMPTY_STATS };
}

/** Wins extend the streak, losses end it, draws leave it alone. */
export function nextStats(stats: Stats, outcome: Outcome): Stats {
  if (outcome === 'draw') return stats;
  if (outcome === 'loss') return { streak: 0, best: stats.best };
  const streak = Math.min(stats.streak + 1, 1_000_000);
  return { streak, best: Math.max(stats.best, streak) };
}

export const isMilestone = (streak: number): boolean => CONFIG.stats.milestones.includes(streak);

export function bumpScore(scores: Scores, key: keyof Scores): Scores {
  return { ...scores, [key]: Math.min(scores[key] + 1, 1_000_000) };
}

export const loadScores = (): Scores => parseScores(readJson(SCORES_KEY));
export const saveScores = (s: Scores): void => void writeJson(SCORES_KEY, s);
export const loadStats = (): Stats => parseStats(readJson(STATS_KEY));
export const saveStats = (s: Stats): void => void writeJson(STATS_KEY, s);
