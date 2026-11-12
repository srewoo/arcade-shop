// Settings, high score, top-5 table and stats persistence. Reads are validated with zod
// per field, so one bad value never resets the rest. Every storage access is wrapped so
// private mode / disabled storage never throws. A discarded value warns once.
import { z } from 'zod';

export const SETTINGS_KEY = 'crumbrun-settings';
export const HIGHSCORE_KEY = 'crumbrun-highscore';
export const SCORES_KEY = 'crumbrun-scores';
export const STATS_KEY = 'crumbrun-stats';

const FIELDS = {
  muted: z.boolean(),
  /** Master volume 0-100. */
  volume: z.number().int().min(0).max(100),
  reduceMotion: z.enum(['system', 'on', 'off']),
  colorAssist: z.boolean(),
  textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
  highContrast: z.boolean(),
  showDpad: z.boolean(),
  leftHanded: z.boolean(),
  /** First-run how-to-play card has been dismissed. */
  seen: z.boolean(),
};

export const SettingsSchema = z.object(FIELDS);
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  muted: false, volume: 80, reduceMotion: 'system', colorAssist: true, textSize: 100,
  highContrast: false, showDpad: false, leftHanded: false, seen: false,
});

export const HighScoreSchema = z.number().int().min(0).max(99_999_999);

export const ScoreEntrySchema = z.object({
  score: HighScoreSchema,
  level: z.number().int().min(1).max(9999),
  date: z.string().max(40),
}).strict();
export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export const TOP_SCORES = 5;

export const StatsSchema = z.object({
  bestLevel: z.number().int().min(0).max(9999),
  bestChain: z.number().int().min(0).max(99),
});
export type Stats = z.infer<typeof StatsSchema>;
export const DEFAULT_STATS: Readonly<Stats> = Object.freeze({ bestLevel: 0, bestChain: 0 });

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function defaultStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const warned = new Set<string>();
/** Test hook: forget which discards have already been warned about. */
export function resetWarnings(): void {
  warned.clear();
}

function warnOnce(what: string): void {
  if (warned.has(what)) return;
  warned.add(what);
  console.warn(`Crumb Run: ignored invalid saved ${what}; using the default.`);
}

function readJson(store: KeyValueStore | null, key: string): unknown {
  let raw: string | null | undefined;
  try {
    raw = store?.getItem(key);
  } catch {
    return undefined;
  }
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    warnOnce(key);
    return undefined;
  }
}

function writeJson(store: KeyValueStore | null, key: string, value: unknown): boolean {
  try {
    store?.setItem(key, JSON.stringify(value));
    return store != null;
  } catch {
    return false;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Per-field fallback: keep every valid key, default only the invalid ones. */
function parseFields<S extends z.ZodRawShape>(shape: S, raw: unknown, defaults: Record<string, unknown>,
  label: string): z.infer<z.ZodObject<S>> {
  const out: Record<string, unknown> = { ...defaults };
  if (raw === undefined) return out as z.infer<z.ZodObject<S>>;
  if (!isRecord(raw)) {
    warnOnce(label);
    return out as z.infer<z.ZodObject<S>>;
  }
  for (const [k, schema] of Object.entries(shape)) {
    if (!(k in raw)) continue;
    const r = (schema as z.ZodType).safeParse(raw[k]);
    if (r.success) out[k] = r.data;
    else warnOnce(`${label}.${k}`);
  }
  return out as z.infer<z.ZodObject<S>>;
}

export function loadSettings(store: KeyValueStore | null = defaultStore()): Settings {
  return parseFields(FIELDS, readJson(store, SETTINGS_KEY), DEFAULT_SETTINGS, 'settings');
}

export function saveSettings(s: Settings, store: KeyValueStore | null = defaultStore()): boolean {
  return writeJson(store, SETTINGS_KEY, SettingsSchema.parse(s));
}

/** Merge a partial change into the saved settings and persist the whole object. */
export function updateSettings(patch: Partial<Settings>, store: KeyValueStore | null = defaultStore()): Settings {
  const next = SettingsSchema.parse({ ...loadSettings(store), ...patch });
  writeJson(store, SETTINGS_KEY, next);
  return next;
}

export function loadHighScore(store: KeyValueStore | null = defaultStore()): number {
  const raw = readJson(store, HIGHSCORE_KEY);
  const parsed = HighScoreSchema.safeParse(raw);
  if (!parsed.success && raw !== undefined) warnOnce(HIGHSCORE_KEY);
  return parsed.success ? parsed.data : 0;
}

export function saveHighScore(score: number, store: KeyValueStore | null = defaultStore()): boolean {
  const parsed = HighScoreSchema.safeParse(Math.floor(score));
  return parsed.success ? writeJson(store, HIGHSCORE_KEY, parsed.data) : false;
}

export function sortScores(list: readonly ScoreEntry[]): ScoreEntry[] {
  return [...list].sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, TOP_SCORES);
}

export function loadScores(store: KeyValueStore | null = defaultStore()): ScoreEntry[] {
  const raw = readJson(store, SCORES_KEY);
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    warnOnce(SCORES_KEY);
    return [];
  }
  const good = raw.flatMap((e) => {
    const r = ScoreEntrySchema.safeParse(e);
    return r.success ? [r.data] : [];
  });
  if (good.length !== raw.length) warnOnce(`${SCORES_KEY} entries`);
  return sortScores(good);
}

/** Add a finished run to the top-5 table (score 0 is not recorded). Returns the new table. */
export function recordScore(entry: ScoreEntry, store: KeyValueStore | null = defaultStore()): ScoreEntry[] {
  const parsed = ScoreEntrySchema.safeParse(entry);
  const table = loadScores(store);
  if (!parsed.success || parsed.data.score <= 0) return table;
  const next = sortScores([...table, parsed.data]);
  writeJson(store, SCORES_KEY, next);
  return next;
}

export function loadStats(store: KeyValueStore | null = defaultStore()): Stats {
  return parseFields(StatsSchema.shape, readJson(store, STATS_KEY), DEFAULT_STATS, 'stats');
}

/** Keep the best level and best chain ever reached. */
export function recordStats(level: number, chain: number, store: KeyValueStore | null = defaultStore()): Stats {
  const cur = loadStats(store);
  const next = StatsSchema.parse({
    bestLevel: Math.max(cur.bestLevel, Math.min(9999, Math.floor(level))),
    bestChain: Math.max(cur.bestChain, Math.min(99, Math.floor(chain))),
  });
  writeJson(store, STATS_KEY, next);
  return next;
}
