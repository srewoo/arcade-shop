// High scores: one best entry per mode+difficulty, validated per field.
import * as z from 'zod/mini';
import type { DifficultyId, ModeId } from './config';
import { readJson, writeJson } from './storage';

export const SCORES_KEY = 'sky-scores';

export const BestSchema = z.strictObject({
  score: z.int().check(z.gte(0), z.lte(999_999_999)),
  wave: z.int().check(z.gte(0), z.lte(9999)),
});
export type Best = z.infer<typeof BestSchema>;
export type ScoreBook = Readonly<Record<string, Best>>;

export const MODES: readonly ModeId[] = ['campaign', 'endless'];
export const LEVELS: readonly DifficultyId[] = ['easy', 'normal', 'hard'];
export const boardKey = (mode: ModeId, level: DifficultyId): string => `${mode}-${level}`;
export const ALL_KEYS: readonly string[] = MODES.flatMap((m) => LEVELS.map((l) => boardKey(m, l)));

export function parseScores(raw: unknown): ScoreBook {
  const out: Record<string, Best> = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const key of ALL_KEYS) {
    const r = z.safeParse(BestSchema, (raw as Record<string, unknown>)[key]);
    if (r.success) out[key] = r.data;
  }
  return out;
}

export const bestFor = (book: ScoreBook, mode: ModeId, level: DifficultyId): Best => book[boardKey(mode, level)] ?? { score: 0, wave: 0 };

/** Returns the updated book and whether this run set a new best score. */
export function recordRun(book: ScoreBook, mode: ModeId, level: DifficultyId, score: number, wave: number): { book: ScoreBook; isBest: boolean } {
  const prev = bestFor(book, mode, level);
  const s = Math.max(0, Math.min(999_999_999, Math.floor(score)));
  const w = Math.max(0, Math.min(9999, Math.floor(wave)));
  const isBest = s > prev.score;
  const next: Best = { score: Math.max(prev.score, s), wave: Math.max(prev.wave, w) };
  return { book: { ...book, [boardKey(mode, level)]: next }, isBest };
}

export const loadScores = (): ScoreBook => parseScores(readJson(SCORES_KEY));
export const saveScores = (b: ScoreBook): void => void writeJson(SCORES_KEY, b);
