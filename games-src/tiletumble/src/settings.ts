// Settings persistence. Everything read back from storage is validated with
// zod (mini build); each bad field falls back on its own.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const SETTINGS_KEY = 'tt-settings';

export const SettingsSchema = z.strictObject({
  lastMode: z.enum(['classic', 'moves', 'endless', 'daily']),
  theme: z.enum(['system', 'light', 'dark']),
  sound: z.boolean(),
  volume: z.int().check(z.gte(0), z.lte(100)),
  reduceMotion: z.enum(['system', 'on', 'off']),
  colorAssist: z.boolean(),
  /** True once the player has toggled colour-blind assist themselves (so an explicit Off is kept). */
  assistChosen: z.boolean(),
  textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
});
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  lastMode: 'classic',
  theme: 'system',
  sound: true,
  volume: CONFIG.audio.defaultVolume,
  reduceMotion: 'system',
  colorAssist: true,
  assistChosen: false,
  textSize: 100,
});

export const SETTING_KEYS = Object.keys(SettingsSchema.shape) as SettingKey[];

/** Validate one field; undefined when the value is not acceptable. */
export function parseField<K extends SettingKey>(key: K, value: unknown): Settings[K] | undefined {
  const result = z.safeParse(SettingsSchema.shape[key], value);
  return result.success ? (result.data as Settings[K]) : undefined;
}

/** Parse stored settings: keep each valid field, default the rest. */
export function parseSettings(raw: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out as Settings;
  for (const key of SETTING_KEYS) {
    const parsed = parseField(key, (raw as Record<string, unknown>)[key]);
    if (parsed !== undefined) out[key] = parsed;
  }
  return migrateAssist(out as Settings);
}

/**
 * Glyphs are on by default. Saves from before the default flipped hold colorAssist=false for
 * everyone who never touched it, so Off is only kept when the player explicitly chose it.
 */
export function migrateAssist(parsed: Settings): Settings {
  if (parsed.assistChosen || parsed.colorAssist) return parsed;
  return { ...parsed, colorAssist: true };
}

export const loadSettings = (): Settings => parseSettings(readJson(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => void writeJson(SETTINGS_KEY, s);
