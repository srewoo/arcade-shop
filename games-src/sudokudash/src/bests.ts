// Personal bests, keyed by difficulty and split by mode so a quick Dash finish never replaces
// a considered Classic time. Old saves ({bestTimeMs, bestScore}) are migrated on read.
import { z } from 'zod';
import { DIFFICULTIES, type Difficulty } from './core/grader';
import { KEYS, readJson, writeJson, type Mode } from './storage';

const Time = z.number().int().min(1).max(86_400_000).nullable();
const BestSchema = z
  .object({
    classicTimeMs: Time,
    dashTimeMs: Time,
    dashScore: z.number().int().min(0).max(100_000_000),
  })
  .strict();
/** Shape used before the polish pass: one time for either mode plus the Dash score. */
const LegacyBestSchema = z
  .object({ bestTimeMs: Time, bestScore: z.number().int().min(0).max(100_000_000) })
  .strict();

export type Best = z.infer<typeof BestSchema>;
export type Bests = Record<Difficulty, Best>;

export const emptyBest = (): Best => ({ classicTimeMs: null, dashTimeMs: null, dashScore: 0 });
export const emptyBests = (): Bests => ({ easy: emptyBest(), medium: emptyBest(), hard: emptyBest(), expert: emptyBest() });

/**
 * Legacy rows did not record which mode set the time. A row with a Dash score is assumed to be a
 * Dash record (score-less rows can only come from Classic wins), so nothing is lost either way.
 */
function migrate(old: z.infer<typeof LegacyBestSchema>): Best {
  if (old.bestScore > 0) return { classicTimeMs: null, dashTimeMs: old.bestTimeMs, dashScore: old.bestScore };
  return { classicTimeMs: old.bestTimeMs, dashTimeMs: null, dashScore: 0 };
}

export function parseBests(raw: unknown): Bests {
  const out = emptyBests();
  if (typeof raw !== 'object' || raw === null) return out;
  for (const d of DIFFICULTIES) {
    const row = (raw as Record<string, unknown>)[d];
    const fresh = BestSchema.safeParse(row);
    if (fresh.success) {
      out[d] = fresh.data;
      continue;
    }
    const legacy = LegacyBestSchema.safeParse(row);
    if (legacy.success) out[d] = migrate(legacy.data);
  }
  return out;
}

export interface Records {
  readonly newTime: boolean;
  readonly newScore: boolean;
}

/** Returns the updated bests and which records (if any) were broken. Classic wins only touch the Classic time. */
export function recordResult(
  bests: Bests,
  difficulty: Difficulty,
  mode: Mode,
  timeMs: number,
  score: number,
): { bests: Bests; newTime: boolean; newScore: boolean } {
  const prev = bests[difficulty];
  const t = Math.max(1, Math.round(timeMs));
  if (mode === 'classic') {
    const newTime = prev.classicTimeMs === null || timeMs < prev.classicTimeMs;
    return { bests: { ...bests, [difficulty]: { ...prev, classicTimeMs: newTime ? t : prev.classicTimeMs } }, newTime, newScore: false };
  }
  const newTime = prev.dashTimeMs === null || timeMs < prev.dashTimeMs;
  const newScore = score > prev.dashScore;
  const next: Best = {
    ...prev,
    dashTimeMs: newTime ? t : prev.dashTimeMs,
    dashScore: newScore ? Math.round(score) : prev.dashScore,
  };
  return { bests: { ...bests, [difficulty]: next }, newTime, newScore };
}

export const loadBests = (): Bests => parseBests(readJson(KEYS.bests));
export const saveBests = (b: Bests): void => writeJson(KEYS.bests, b);
