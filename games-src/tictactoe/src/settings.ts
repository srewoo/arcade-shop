// Settings persistence. Everything read back from storage is validated with
// zod (mini build, to keep the bundle small); each bad field falls back alone.
import * as z from 'zod/mini';
import { CONFIG } from './config';
import { readJson, writeJson } from './storage';

export const SETTINGS_KEY = 'ttt-settings';

export const SettingsSchema = z.strictObject({
  opponent: z.enum(['cpu', 'human']),
  level: z.enum(['easy', 'medium', 'strong', 'hard']),
  variant: z.enum(['classic', 'vanishing']),
  first: z.enum(['X', 'O', 'alternate']),
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
  opponent: 'cpu',
  level: 'medium',
  variant: 'classic',
  first: 'alternate',
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

/** Settings whose change abandons the round in progress. */
export const RESTART_KEYS: readonly SettingKey[] = ['opponent', 'variant', 'first'];

export const loadSettings = (): Settings => parseSettings(readJson(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => void writeJson(SETTINGS_KEY, s);
