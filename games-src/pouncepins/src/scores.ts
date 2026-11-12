// Lifetime stats (best score, games, strikes, spares), validated per field.
import * as z from 'zod/mini';
import { readJson, writeJson } from './storage';

export const SCORES_KEY = 'pp-scores';

const count = (): z.ZodMiniInt => z.int().check(z.gte(0), z.lte(1_000_000));

export const ScoresSchema = z.strictObject({ best: count(), games: count(), strikes: count(), spares: count(), fish: count() });
export type Scores = z.infer<typeof ScoresSchema>;

export const EMPTY_SCORES: Readonly<Scores> = Object.freeze({ best: 0, games: 0, strikes: 0, spares: 0, fish: 0 });

export function parseScores(raw: unknown): Scores {
  const out: Scores = { ...EMPTY_SCORES };
  if (typeof raw !== 'object' || raw === null) return out;
  for (const key of Object.keys(ScoresSchema.shape) as (keyof Scores)[]) {
    const r = z.safeParse(ScoresSchema.shape[key], (raw as Record<string, unknown>)[key]);
    if (r.success) out[key] = r.data;
  }
  return out;
}

export interface GameSummary { readonly score: number; readonly strikes: number; readonly spares: number; readonly fish: number }

/** Fold one finished game into the lifetime stats (pure). */
export function recordGame(prev: Scores, g: GameSummary): Scores {
  const cap = (n: number): number => Math.min(1_000_000, n);
  return {
    best: Math.max(prev.best, Math.min(1_000_000, g.score)),
    games: cap(prev.games + 1), strikes: cap(prev.strikes + g.strikes),
    spares: cap(prev.spares + g.spares), fish: cap(prev.fish + g.fish),
  };
}

export const loadScores = (): Scores => parseScores(readJson(SCORES_KEY));
export const saveScores = (s: Scores): void => void writeJson(SCORES_KEY, s);
