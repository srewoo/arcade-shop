// Settings + high-score persistence. Everything read back from storage is
// validated with zod; anything invalid falls back to defaults. All storage
// access is wrapped in try/catch.
import { z } from 'zod';
import { readJson, writeJson } from './storage';

const SETTINGS_KEY = 'luckylanes-settings';
const SCORES_KEY = 'luckylanes-highscores';

export const MODES = ['solo', 'hotseat', 'cpu', 'spare'] as const;
export type Mode = (typeof MODES)[number];

export const SettingsSchema = z
  .object({
    mode: z.enum(MODES),
    players: z.number().int().min(2).max(4),
    cpuLevel: z.enum(['casual', 'easy', 'pro']),
    theme: z.enum(['system', 'light', 'dark']),
    sound: z.boolean(),
    /** Master volume 0-100. */
    volume: z.number().int().min(0).max(100),
    reduceMotion: z.enum(['system', 'on', 'off']),
    cbAssist: z.boolean(),
    textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
    /** Wide-pocket assist (flatter aim and hook meters). */
    widePocket: z.boolean(),
    fastCpu: z.boolean(),
    /** First-run coach card has been dismissed. */
    seenIntro: z.boolean(),
    /** Throws made so far, for the first-throws drag hint. */
    throws: z.number().int().min(0).max(1000),
  })
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  mode: 'solo', players: 2, cpuLevel: 'casual', theme: 'system', sound: true, volume: 80,
  reduceMotion: 'system', cbAssist: false, textSize: 100, widePocket: false, fastCpu: false, seenIntro: false, throws: 0,
});

/** Parse stored settings; keeps each valid field and defaults the rest. */
export function parseSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out;
  const shape = SettingsSchema.shape;
  for (const key of Object.keys(shape) as (keyof Settings)[]) {
    const parsed = shape[key].safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) (out as Record<keyof Settings, unknown>)[key] = parsed.data;
  }
  return out;
}

export const HIGH_SCORE_KEYS = ['solo', 'hotseat', 'cpuCasual', 'cpuEasy', 'cpuPro', 'spare'] as const;
export type HighScoreKey = (typeof HIGH_SCORE_KEYS)[number];

export const MAX_ENTRIES = 5;
export const EntrySchema = z.object({ score: z.number().int().min(0).max(300), at: z.number().int().min(0) }).strict();
export type ScoreEntry = z.infer<typeof EntrySchema>;
export type HighScores = Record<HighScoreKey, ScoreEntry[]>;

export const emptyHighScores = (): HighScores => ({ solo: [], hotseat: [], cpuCasual: [], cpuEasy: [], cpuPro: [], spare: [] });

const sortDesc = (list: ScoreEntry[]): ScoreEntry[] =>
  [...list].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, MAX_ENTRIES);

/** Keep valid entries of each list, drop the rest, sort and trim. */
export function parseHighScores(raw: unknown): HighScores {
  const out = emptyHighScores();
  if (typeof raw !== 'object' || raw === null) return out;
  for (const key of HIGH_SCORE_KEYS) {
    const list = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(list)) continue;
    const valid = list.slice(0, 100).flatMap((item) => {
      const p = EntrySchema.safeParse(item);
      return p.success ? [p.data] : [];
    });
    out[key] = sortDesc(valid);
  }
  return out;
}

/** Add a score; returns the new table and the 1-based rank, or null if it did not place. */
export function addHighScore(hs: HighScores, key: HighScoreKey, score: number, at: number): { scores: HighScores; rank: number | null } {
  const entry = EntrySchema.safeParse({ score, at });
  if (!entry.success || score <= 0) return { scores: hs, rank: null };
  const list = sortDesc([...hs[key], entry.data]);
  const rank = list.findIndex((e) => e === entry.data);
  return { scores: { ...hs, [key]: list }, rank: rank === -1 ? null : rank + 1 };
}

export const loadSettings = (): Settings => parseSettings(readJson(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => writeJson(SETTINGS_KEY, s);
export const loadHighScores = (): HighScores => parseHighScores(readJson(SCORES_KEY));
export const saveHighScores = (h: HighScores): void => writeJson(SCORES_KEY, h);
