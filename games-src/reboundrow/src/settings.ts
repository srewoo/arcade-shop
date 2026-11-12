// Settings persistence. Every field read back is validated with zod; each bad field falls back alone.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const SETTINGS_KEY = 'rr-settings';

export const SettingsSchema = z.strictObject({
  volume: z.int().check(z.gte(0), z.lte(100)),
  sound: z.boolean(),
  reduceMotion: z.enum(['system', 'on', 'off']),
  colorAssist: z.boolean(),
  textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]),
  theme: z.enum(['system', 'light', 'dark']),
});
export type Settings = z.infer<typeof SettingsSchema>;
export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  volume: CONFIG.audio.defaultVolume,
  sound: true,
  reduceMotion: 'system',
  colorAssist: false,
  textSize: 100,
  theme: 'system',
});

export const SETTING_KEYS = Object.keys(SettingsSchema.shape) as SettingKey[];

export function parseField<K extends SettingKey>(key: K, value: unknown): Settings[K] | undefined {
  const result = z.safeParse(SettingsSchema.shape[key], value);
  return result.success ? (result.data as Settings[K]) : undefined;
}

export function parseSettings(raw: unknown): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return out as Settings;
  for (const key of SETTING_KEYS) {
    const parsed = parseField(key, (raw as Record<string, unknown>)[key]);
    if (parsed !== undefined) out[key] = parsed;
  }
  return out as Settings;
}

export const loadSettings = (): Settings => parseSettings(readJson(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => void writeJson(SETTINGS_KEY, s);
