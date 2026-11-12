// Campaign progress and best scores, validated per field on load.
import * as z from 'zod/mini';
import { LEVEL_COUNT } from './levels';
import { readJson, writeJson } from './storage';

export const PROGRESS_KEY = 'rr-progress';

const count = z.int().check(z.gte(0), z.lte(100_000_000));
export const ProgressSchema = z.strictObject({
  unlocked: z.int().check(z.gte(1)),
  bestCampaign: count,
  bestEndless: count,
  bestEndlessLevel: z.int().check(z.gte(0), z.lte(10_000)),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const DEFAULT_PROGRESS: Readonly<Progress> = Object.freeze({
  unlocked: 1,
  bestCampaign: 0,
  bestEndless: 0,
  bestEndlessLevel: 0,
});

export function parseProgress(raw: unknown): Progress {
  const out: Progress = { ...DEFAULT_PROGRESS };
  if (typeof raw !== 'object' || raw === null) return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_PROGRESS) as (keyof Progress)[]) {
    const r = z.safeParse(ProgressSchema.shape[key], src[key]);
    if (r.success) out[key] = r.data;
  }
  out.unlocked = Math.min(out.unlocked, LEVEL_COUNT);
  return out;
}

export const loadProgress = (): Progress => parseProgress(readJson(PROGRESS_KEY));
export const saveProgress = (p: Progress): void => void writeJson(PROGRESS_KEY, p);

/** Record a finished campaign level / run; returns the updated record. */
export function recordCampaign(p: Progress, level: number, score: number): Progress {
  return {
    ...p,
    unlocked: Math.min(LEVEL_COUNT, Math.max(p.unlocked, level + 1)),
    bestCampaign: Math.max(p.bestCampaign, score),
  };
}

export function recordEndless(p: Progress, level: number, score: number): Progress {
  return {
    ...p,
    bestEndless: Math.max(p.bestEndless, score),
    bestEndlessLevel: Math.max(p.bestEndlessLevel, level),
  };
}
