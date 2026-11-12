// Settings + high-score persistence. Everything read back from storage is
// validated with zod; anything unknown falls back to defaults, field by field.
import { z } from 'zod';

const SETTINGS_KEY = 'pc-settings';
const SCORES_KEY = 'pc-scores';
export const PUZZLE_COUNT = 12;
/** Scores layout version. v2: puzzle pars were recalibrated, so saved stars restart. */
export const SCORES_VERSION = 2;

export const HINT_KINDS = ['bomb', 'rainbow', 'stone', 'ceiling'] as const;
export type HintKind = (typeof HINT_KINDS)[number];

export const SettingsSchema = z
  .object({
    theme: z.enum(['system', 'light', 'dark']),
    sound: z.boolean(),
    volume: z.number().int().min(0).max(100),
    symbols: z.boolean(),
    motion: z.enum(['system', 'reduce', 'full']),
    textScale: z.union([z.literal(100), z.literal(125), z.literal(150)]),
    highContrast: z.boolean(),
    seenTutorial: z.boolean(),
    seenHints: z.array(z.enum(HINT_KINDS)).max(HINT_KINDS.length),
  })
  .strict();
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  theme: 'system',
  sound: true,
  volume: 80,
  symbols: false,
  motion: 'system',
  textScale: 100,
  highContrast: false,
  seenTutorial: false,
  seenHints: [],
});

const Points = z.number().int().min(0).max(100_000_000);
export const ScoresSchema = z
  .object({
    v: z.literal(SCORES_VERSION),
    arcade: Points,
    rush: Points,
    puzzle: Points,
    daily: Points,
    dailyDay: z.number().int().min(0).max(99_991_231),
    dailyToday: Points,
    stars: z.array(z.number().int().min(0).max(3)).length(PUZZLE_COUNT),
  })
  .strict();
export type Scores = z.infer<typeof ScoresSchema>;
export type ScoreMode = 'arcade' | 'rush' | 'puzzle' | 'daily';

export const emptyScores = (): Scores => ({
  v: SCORES_VERSION,
  arcade: 0,
  rush: 0,
  puzzle: 0,
  daily: 0,
  dailyDay: 0,
  dailyToday: 0,
  stars: new Array<number>(PUZZLE_COUNT).fill(0),
});

/** Defaults for a first run: symbols start on when the OS asks for more contrast. */
export const firstRunSettings = (prefersContrast: boolean): Settings => ({ ...DEFAULT_SETTINGS, seenHints: [], symbols: prefersContrast });

/** Parse stored settings; keeps each valid field and defaults the rest. */
export function parseSettings(raw: unknown, base: Settings = { ...DEFAULT_SETTINGS, seenHints: [] }): Settings {
  const out: Settings = { ...base };
  if (typeof raw !== 'object' || raw === null) return out;
  const shape = SettingsSchema.shape;
  for (const key of Object.keys(shape) as (keyof Settings)[]) {
    const parsed = shape[key].safeParse((raw as Record<string, unknown>)[key]);
    if (parsed.success) (out as Record<keyof Settings, unknown>)[key] = parsed.data;
  }
  return out;
}

/** Parse stored scores. Older layouts keep their point bests but restart puzzle stars. */
export function parseScores(raw: unknown): Scores {
  const parsed = ScoresSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const out = emptyScores();
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as Record<string, unknown>;
  for (const k of ['arcade', 'rush', 'puzzle', 'daily', 'dailyToday'] as const) {
    const p = Points.safeParse(r[k]);
    if (p.success) out[k] = p.data;
  }
  const day = ScoresSchema.shape.dailyDay.safeParse(r.dailyDay);
  if (day.success) out.dailyDay = day.data;
  const stars = ScoresSchema.shape.stars.safeParse(r.stars);
  if (r.v === SCORES_VERSION && stars.success) out.stars = stars.data;
  return out;
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
    console.warn(`[pc] could not save ${key}`, err);
  }
}

function prefersContrast(): boolean {
  try {
    return matchMedia('(prefers-contrast: more)').matches || matchMedia('(forced-colors: active)').matches;
  } catch {
    return false;
  }
}

export function loadSettings(): Settings {
  const raw = read(SETTINGS_KEY);
  return raw === null ? firstRunSettings(prefersContrast()) : parseSettings(raw);
}
export const saveSettings = (s: Settings): void => write(SETTINGS_KEY, s);
export const loadScores = (): Scores => parseScores(read(SCORES_KEY));
export const saveScores = (s: Scores): void => write(SCORES_KEY, s);

/** yyyymmdd for a local date, used as the Daily Arcade seed and score key. */
export const dayNumber = (d: Date): number => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** Today's Daily best (0 if the stored day differs). */
export const dailyTodayBest = (s: Scores, day: number): number => (s.dailyDay === day ? s.dailyToday : 0);

/** Record a finished game; returns the updated scores and whether it is a new best. */
export function recordScore(
  scores: Scores,
  mode: ScoreMode,
  score: number,
  puzzle?: { index: number; stars: number },
  day = 0,
): { scores: Scores; best: boolean } {
  const next: Scores = { ...scores, stars: [...scores.stars] };
  const capped = Math.min(score, 100_000_000);
  let best: boolean;
  if (mode === 'daily') {
    const today = dailyTodayBest(scores, day);
    best = score > today;
    next.dailyDay = day;
    next.dailyToday = Math.max(today, capped);
    next.daily = Math.max(next.daily, capped);
  } else {
    best = score > next[mode];
    if (best) next[mode] = capped;
  }
  if (puzzle && puzzle.index >= 0 && puzzle.index < PUZZLE_COUNT) {
    next.stars[puzzle.index] = Math.max(next.stars[puzzle.index] ?? 0, puzzle.stars);
  }
  return { scores: next, best };
}
