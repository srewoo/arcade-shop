// localStorage persistence. Everything read back is validated with zod and every access
// is wrapped in try/catch, so corrupt or unavailable storage never breaks the game.
import { z } from 'zod';

export const KEYS = {
  settings: 'sudokudash-settings',
  bests: 'sudokudash-bests',
  game: 'sudokudash-game',
  pool: 'sudokudash-pool',
  daily: 'sudokudash-daily',
  seen: 'sudokudash-seen',
  dailyCache: 'sudokudash-dailycache',
} as const;

export function readJson(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[sudokudash] could not save ${key}`, err);
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

export const DifficultySchema = z.enum(['easy', 'medium', 'hard', 'expert']);
export const ModeSchema = z.enum(['dash', 'classic']);
export type Mode = z.infer<typeof ModeSchema>;

export const SettingsSchema = z
  .object({
    theme: z.enum(['system', 'light', 'dark']),
    sound: z.boolean(),
    mode: ModeSchema,
    difficulty: DifficultySchema,
    mistakeLimit: z.boolean(),
    autoRemoveNotes: z.boolean(),
    /** Master volume, 0-100. `sound` stays the mute switch (M key). */
    volume: z.number().int().min(0).max(100),
    /** System follows prefers-reduced-motion; On forces calm; Off forces full effects. */
    reduceMotion: z.enum(['system', 'on', 'off']),
    colorBlind: z.boolean(),
    textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
  })
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  theme: 'system',
  sound: true,
  mode: 'dash',
  difficulty: 'easy',
  mistakeLimit: true,
  autoRemoveNotes: true,
  volume: 80,
  reduceMotion: 'system',
  colorBlind: false,
  textSize: 100,
});

/** Keeps each valid field and defaults the rest. */
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

export const loadSettings = (): Settings => parseSettings(readJson(KEYS.settings));
export const saveSettings = (s: Settings): void => writeJson(KEYS.settings, s);
