// Local bests per mode, zod-validated per field. Unlock rules derive from the bests.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import type { Mode } from './modes';
import { readJson, writeJson } from './storage';

export const BEST_KEY = 'keepyup:best';
const nat = z.int().check(z.gte(0), z.lte(1_000_000));
export const BestSchema = z.strictObject({ classic: nat, twoballs: nat, windy: nat });
export type Best = z.infer<typeof BestSchema>;
export const EMPTY_BEST: Readonly<Best> = Object.freeze({ classic: 0, twoballs: 0, windy: 0 });

export function parseBest(raw: unknown): Best {
  const out: Record<string, number> = { ...EMPTY_BEST };
  if (typeof raw !== 'object' || raw === null) return out as Best;
  for (const key of Object.keys(BestSchema.shape) as (keyof Best)[]) {
    const r = z.safeParse(BestSchema.shape[key], (raw as Record<string, unknown>)[key]);
    if (r.success) out[key] = r.data;
  }
  return out as Best;
}

export const loadBest = (): Best => parseBest(readJson(BEST_KEY));
export const saveBest = (b: Best): void => void writeJson(BEST_KEY, b);

export function withScore(best: Best, mode: Mode, score: number): { best: Best; isNew: boolean } {
  if (score <= best[mode]) return { best, isNew: false };
  return { best: { ...best, [mode]: score }, isNew: true };
}

/** Two Balls opens once Classic has reached the unlock score. */
export const isUnlocked = (mode: Mode, best: Best): boolean =>
  mode !== 'twoballs' || best.classic >= CONFIG.twoBalls.unlockScore || best.twoballs > 0;
