// Settings persistence. Everything read back from storage is validated with
// zod (mini build); each bad field falls back alone.
import * as z from 'zod/mini';
import { CONFIG, STORAGE_KEYS } from './config';
import { readJson, writeJson } from './storage';

export const SettingsSchema = z.strictObject({
  theme: z.enum(['system', 'light', 'dark']),
  sound: z.boolean(),
  volume: z.int().check(z.gte(0), z.lte(100)),
  reduceMotion: z.enum(['system', 'on', 'off']),
  colorAssist: z.boolean(),
  textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
});
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  theme: 'system',
  sound: true,
  volume: CONFIG.audio.defaultVolume,
  reduceMotion: 'system',
  colorAssist: false,
  textSize: 100,
});

export const SETTING_KEYS = Object.keys(SettingsSchema.shape) as SettingKey[];

/** Validate one field; undefined when the value is not acceptable. */
export function parseField<K extends SettingKey>(key: K, value: unknown): Settings[K] | undefined {
  const result = z.safeParse(SettingsSchema.shape[key], value);
  return result.success ? (result.data as Settings[K]) : undefined;
}

/** Parse stored settings; keeps each valid field and defaults the rest. */
export function parseSettings(raw: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out as Settings;
  for (const key of SETTING_KEYS) {
    const parsed = parseField(key, (raw as Record<string, unknown>)[key]);
    if (parsed !== undefined) out[key] = parsed;
  }
  return out as Settings;
}

export const loadSettings = (): Settings => parseSettings(readJson(STORAGE_KEYS.settings));
export const saveSettings = (s: Settings): void => void writeJson(STORAGE_KEYS.settings, s);
