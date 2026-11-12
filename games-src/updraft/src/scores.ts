// Persistent bests and the practice/daily ghost. All reads are zod-validated per field.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import type { Mode } from './modes';
import { readJson, writeJson } from './storage';

export const BEST_KEY = 'updraft-best';
export const GHOST_KEY = 'updraft-ghosts';

const nat = z.int().check(z.gte(0), z.lte(10_000_000));
const DateField = z.union([z.literal(''), z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/))]);

export const BestSchema = z.strictObject({ endless: nat, practice: nat, daily: nat, dailyDate: DateField });
export type Best = z.infer<typeof BestSchema>;
export const EMPTY_BEST: Readonly<Best> = Object.freeze({ endless: 0, practice: 0, daily: 0, dailyDate: '' });

export const GhostSchema = z.strictObject({
  seedKey: z.string().check(z.minLength(1), z.maxLength(60)),
  score: nat,
  toggles: z.array(nat).check(z.maxLength(CONFIG.ghost.maxToggles)),
});
export type GhostRecord = z.infer<typeof GhostSchema>;
export interface Ghosts { practice: GhostRecord | null; daily: GhostRecord | null }

const field = <S extends z.ZodMiniType>(schema: S, v: unknown): z.output<S> | undefined => {
  const r = z.safeParse(schema, v);
  return r.success ? r.data : undefined;
};

export function parseBest(raw: unknown): Best {
  const out: Record<string, unknown> = { ...EMPTY_BEST };
  if (typeof raw !== 'object' || raw === null) return out as Best;
  for (const key of Object.keys(BestSchema.shape) as (keyof Best)[]) {
    const v = field(BestSchema.shape[key], (raw as Record<string, unknown>)[key]);
    if (v !== undefined) out[key] = v;
  }
  return out as Best;
}

export function parseGhosts(raw: unknown): Ghosts {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return { practice: field(GhostSchema, o.practice) ?? null, daily: field(GhostSchema, o.daily) ?? null };
}

export const loadBest = (): Best => parseBest(readJson(BEST_KEY));
export const loadGhosts = (): Ghosts => parseGhosts(readJson(GHOST_KEY));
export const saveBest = (b: Best): void => void writeJson(BEST_KEY, b);
export const saveGhosts = (g: Ghosts): void => void writeJson(GHOST_KEY, g);

/** Best for a mode; the Daily best only counts for the day it was set. */
export function bestFor(best: Best, mode: Mode, today: string): number {
  if (mode === 'daily') return best.dailyDate === today ? best.daily : 0;
  return best[mode];
}

export function withScore(best: Best, mode: Mode, score: number, today: string): { best: Best; isNew: boolean } {
  const prior = bestFor(best, mode, today);
  if (score <= prior) return { best, isNew: false };
  const next: Best = mode === 'daily' ? { ...best, daily: score, dailyDate: today } : { ...best, [mode]: score };
  return { best: next, isNew: true };
}

/** The ghost to replay for this seed, if any. */
export function ghostFor(ghosts: Ghosts, mode: Mode, seedKey: string): GhostRecord | null {
  const g = mode === 'daily' ? ghosts.daily : mode === 'practice' ? ghosts.practice : null;
  return g && g.seedKey === seedKey ? g : null;
}

/** Store a ghost when it beats the one held for the same seed. Returns the updated set. */
export function withGhost(ghosts: Ghosts, mode: Mode, rec: GhostRecord): Ghosts {
  if (mode === 'endless') return ghosts;
  const held = ghostFor(ghosts, mode, rec.seedKey);
  if (held && held.score >= rec.score) return ghosts;
  return { ...ghosts, [mode]: rec };
}
