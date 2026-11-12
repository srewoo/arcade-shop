// Settings changes from the UI arrive as strings; this validates and applies them.
import { parseField, type SettingKey, type Settings } from './settings';

const BOOLS: readonly SettingKey[] = ['sound', 'colorAssist'];
const NUMS: readonly SettingKey[] = ['textSize', 'practiceRound', 'volume'];

export function coerce(key: SettingKey, raw: string): unknown {
  if (BOOLS.includes(key)) return raw === 'true' ? true : raw === 'false' ? false : raw;
  if (NUMS.includes(key)) return Number(raw);
  return raw;
}

/** Returns a new Settings with the change, or the same object if the value is invalid. */
export function applyChange(s: Settings, key: SettingKey, raw: string | number | boolean): Settings {
  const value = typeof raw === 'string' ? coerce(key, raw) : raw;
  const parsed = parseField(key, value);
  return parsed === undefined || parsed === s[key] ? s : { ...s, [key]: parsed };
}

export const settingString = (s: Settings, key: string): string => String(s[key as SettingKey]);
