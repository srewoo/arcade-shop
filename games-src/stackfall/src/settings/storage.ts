// localStorage access: every read validated, every access wrapped.
import { HelpSeenSchema, parseRecords, parseSettings, type Records, type Settings } from './schema';

export const SETTINGS_KEY = 'stackfall-settings';
export const RECORDS_KEY = 'stackfall-records';
export const HELP_KEY = 'stackfall-seen-help';

function readText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read(key: string): unknown {
  try {
    const text = readText(key);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

function writeText(key: string, text: string): void {
  try {
    localStorage.setItem(key, text);
  } catch (err) {
    console.warn(`[stackfall] could not save ${key}`, err);
  }
}

const isTouchDevice = (): boolean => {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
};

export const loadSettings = (): Settings => parseSettings(read(SETTINGS_KEY), isTouchDevice());
export const saveSettings = (s: Settings): void => writeText(SETTINGS_KEY, JSON.stringify(s));
export const loadRecords = (): Records => parseRecords(read(RECORDS_KEY));
export const saveRecords = (r: Records): void => writeText(RECORDS_KEY, JSON.stringify(r));
export const loadHelpSeen = (): boolean => HelpSeenSchema.safeParse(readText(HELP_KEY)).success;
export const saveHelpSeen = (): void => writeText(HELP_KEY, '1');
