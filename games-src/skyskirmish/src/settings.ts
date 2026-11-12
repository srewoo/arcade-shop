// Settings persistence. Everything read back from storage is validated with zod (mini build);
// each bad field falls back on its own.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const SETTINGS_KEY = 'sky-settings';

export const SettingsSchema = z.strictObject({
  difficulty: z.enum(['easy', 'normal', 'hard']),
  mode: z.enum(['campaign', 'endless']),
  autoFire: z.boolean(),
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
  difficulty: 'normal',
  mode: 'campaign',
  autoFire: true,
  theme: 'system',
  sound: true,
  volume: CONFIG.audio.defaultVolume,
  reduceMotion: 'system',
  colorAssist: false,
  textSize: 100,
});

export const SETTING_KEYS = Object.keys(SettingsSchema.shape) as SettingKey[];

/** Validate one field; returns undefined when the value is not acceptable. */
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

/** Reduce motion resolved against the OS preference. */
export function motionReduced(s: Pick<Settings, 'reduceMotion'>, systemPrefers: boolean): boolean {
  return s.reduceMotion === 'on' || (s.reduceMotion === 'system' && systemPrefers);
}

export const loadSettings = (): Settings => parseSettings(readJson(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => void writeJson(SETTINGS_KEY, s);
