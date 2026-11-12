// Settings + progress persistence. Everything read back from storage is validated
// with zod; unknown or corrupt values fall back to defaults. Storage access never throws.
import { z } from 'zod';

const SETTINGS_KEY = 'cornerpocket-settings';
const PROGRESS_KEY = 'cornerpocket-progress';
export const TRICK_COUNT = 15;

export const SettingsSchema = z
  .object({
    level: z.enum(['easy', 'pro']),
    theme: z.enum(['system', 'light', 'dark']),
    sound: z.boolean(),
    volume: z.number().int().min(0).max(100), // master volume, percent
    reduceMotion: z.enum(['system', 'on', 'off']),
    colorAssist: z.boolean(), // colour-blind assist: extra non-colour cues
    textSize: z.union([z.literal(100), z.literal(125), z.literal(150)]), // HUD/text scale, percent
    seen: z.boolean(), // first-run coachmark already shown
    lastMode: z.enum(['rack', 'trick', 'cpu', 'duo']),
  })
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  level: 'easy', theme: 'system', sound: true, volume: 80, reduceMotion: 'system', colorAssist: true, textSize: 100, seen: false, lastMode: 'rack',
});

/** Reduce-motion setting resolved against the OS preference. */
export const effectiveReduced = (s: Pick<Settings, 'reduceMotion'>, systemPrefers: boolean): boolean =>
  s.reduceMotion === 'on' || (s.reduceMotion === 'system' && systemPrefers);

const Count = z.number().int().min(0).max(10_000_000);
export const ProgressSchema = z
  .object({
    rackHigh: Count, // best Rack Attack score
    rackBest: Count, // furthest rack reached
    stars: z.array(z.number().int().min(0).max(3)).length(TRICK_COUNT),
    cpuWins: Count,
    cpuLosses: Count,
  })
  .strict();
export type Progress = z.infer<typeof ProgressSchema>;

export const emptyProgress = (): Progress => ({
  rackHigh: 0, rackBest: 0, stars: new Array<number>(TRICK_COUNT).fill(0), cpuWins: 0, cpuLosses: 0,
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

export function parseProgress(raw: unknown): Progress {
  const base = emptyProgress();
  if (typeof raw !== 'object' || raw === null) return base;
  const rec = raw as Record<string, unknown>;
  const shape = ProgressSchema.shape;
  for (const key of Object.keys(shape) as (keyof Progress)[]) {
    const parsed = shape[key].safeParse(rec[key]);
    if (parsed.success) (base as Record<keyof Progress, unknown>)[key] = parsed.data;
  }
  return base;
}

function read(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[cornerpocket] could not save ${key}`, err);
  }
}

export const loadSettings = (): Settings => parseSettings(read(SETTINGS_KEY));
export const saveSettings = (s: Settings): void => write(SETTINGS_KEY, s);
export const loadProgress = (): Progress => parseProgress(read(PROGRESS_KEY));
export const saveProgress = (p: Progress): void => write(PROGRESS_KEY, p);
