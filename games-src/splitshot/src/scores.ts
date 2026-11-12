// Persistent best score and furthest stage. Reads are zod-validated per field.
import * as z from 'zod/mini';
import { readJson, writeJson } from './storage';

export const BEST_KEY = 'splitshot:best';
export const ONBOARD_KEY = 'splitshot:onboarded';

export const BestSchema = z.strictObject({
  score: z.int().check(z.gte(0), z.lte(100_000_000)),
  stage: z.int().check(z.gte(0), z.lte(9999)),
});
export type Best = z.infer<typeof BestSchema>;
export const EMPTY_BEST: Readonly<Best> = Object.freeze({ score: 0, stage: 0 });

export function parseBest(raw: unknown): Best {
  const out: Best = { ...EMPTY_BEST };
  if (typeof raw !== 'object' || raw === null) return out;
  const o = raw as Record<string, unknown>;
  const s = z.safeParse(BestSchema.shape.score, o.score);
  const g = z.safeParse(BestSchema.shape.stage, o.stage);
  if (s.success) out.score = s.data;
  if (g.success) out.stage = g.data;
  return out;
}

export const loadBest = (): Best => parseBest(readJson(BEST_KEY));
export const saveBest = (b: Best): void => void writeJson(BEST_KEY, b);

/** Merge a finished run into the stored best; `isNew` is true when the score record fell. */
export function mergeBest(best: Best, score: number, stage: number): { best: Best; isNew: boolean } {
  const next: Best = { score: Math.max(best.score, score), stage: Math.max(best.stage, stage) };
  return { best: next, isNew: score > best.score };
}
