// Personal bests. Validated per field on load; a corrupt field resets alone.
import * as z from 'zod/mini';
import type { Mode, Outcome } from './simTypes';
import { readJson, writeJson } from './storage';

export const RECORDS_KEY = 'redline-records';

const score = z.int().check(z.gte(0), z.lte(100_000_000));
export const RecordsSchema = z.strictObject({
  endless: score,
  trial: score,
  trialTime: z.number().check(z.gte(0), z.lte(36000)),
  daily: score,
  dailyDay: z.string().check(z.regex(/^(\d{4}-\d{2}-\d{2})?$/)),
});
export type Records = z.infer<typeof RecordsSchema>;
export const EMPTY_RECORDS: Readonly<Records> = Object.freeze({ endless: 0, trial: 0, trialTime: 0, daily: 0, dailyDay: '' });

export function parseRecords(raw: unknown): Records {
  const out: Record<string, unknown> = { ...EMPTY_RECORDS };
  if (typeof raw !== 'object' || raw === null) return out as Records;
  for (const key of Object.keys(RecordsSchema.shape) as (keyof Records)[]) {
    const r = z.safeParse(RecordsSchema.shape[key], (raw as Record<string, unknown>)[key]);
    if (r.success) out[key] = r.data;
  }
  return out as Records;
}

/** The daily best only counts for the day it was set. */
export const dailyBest = (r: Records, day: string): number => (r.dailyDay === day ? r.daily : 0);

export interface RunSummary { mode: Mode; score: number; outcome: Outcome; runTime: number; day: string }

export function applyRun(r: Records, run: RunSummary): { records: Records; newBest: boolean } {
  const next = { ...r };
  let newBest = false;
  if (run.mode === 'endless' && run.score > r.endless) { next.endless = run.score; newBest = true; }
  if (run.mode === 'daily' && run.score > dailyBest(r, run.day)) { next.daily = run.score; next.dailyDay = run.day; newBest = true; }
  if (run.mode === 'trial') {
    if (run.score > r.trial) { next.trial = run.score; newBest = true; }
    if (run.outcome === 'finish' && (r.trialTime === 0 || run.runTime < r.trialTime)) next.trialTime = Math.round(run.runTime * 100) / 100;
  }
  return { records: next, newBest };
}

export const loadRecords = (): Records => parseRecords(readJson(RECORDS_KEY));
export const saveRecords = (r: Records): void => void writeJson(RECORDS_KEY, r);
