// Best score and level reached, persisted under "zapchain:scores" and validated on load.
import * as z from 'zod/mini';
import { readJson, writeJson } from './storage';

export const SCORES_KEY = 'zapchain:scores';

const ScoresSchema = z.strictObject({
  best: z.int().check(z.gte(0)),
  bestLevel: z.int().check(z.gte(1)),
});
export type Scores = z.infer<typeof ScoresSchema>;

export const EMPTY_SCORES: Readonly<Scores> = Object.freeze({ best: 0, bestLevel: 1 });

export function parseScores(raw: unknown): Scores {
  const r = z.safeParse(ScoresSchema, raw);
  return r.success ? r.data : { ...EMPTY_SCORES };
}

export const loadScores = (): Scores => parseScores(readJson(SCORES_KEY));

/** Record a finished run. Returns the updated scores and whether the score is a new best. */
export function recordRun(prev: Scores, score: number, level: number): { scores: Scores; isNew: boolean } {
  const isNew = score > prev.best;
  const next: Scores = { best: Math.max(prev.best, Math.floor(score)), bestLevel: Math.max(prev.bestLevel, level) };
  if (next.best !== prev.best || next.bestLevel !== prev.bestLevel) writeJson(SCORES_KEY, next);
  return { scores: next, isNew };
}
