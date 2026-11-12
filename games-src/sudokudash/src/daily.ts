// Daily-puzzle history: one result per (date, difficulty), a streak, and the shareable text.
import { z } from 'zod';
import { DIFFICULTIES, type Difficulty } from './core/grader';
import { formatElapsed } from './core/scoring';
import { KEYS, ModeSchema, readJson, writeJson, type Mode } from './storage';

const ResultSchema = z
  .object({
    mode: ModeSchema,
    score: z.number().int().min(0).max(100_000_000),
    timeMs: z.number().int().min(0).max(86_400_000),
    mistakes: z.number().int().min(0).max(999),
  })
  .strict();
export type DailyResult = z.infer<typeof ResultSchema>;
/** date -> difficulty -> result. */
export type DailyLog = Record<string, Partial<Record<Difficulty, DailyResult>>>;

const DateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const KEEP_DAYS = 90;

export function parseDailyLog(raw: unknown): DailyLog {
  const out: DailyLog = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [date, row] of Object.entries(raw as Record<string, unknown>)) {
    if (!DateKey.safeParse(date).success || typeof row !== 'object' || row === null) continue;
    const entry: Partial<Record<Difficulty, DailyResult>> = {};
    for (const d of DIFFICULTIES) {
      const parsed = ResultSchema.safeParse((row as Record<string, unknown>)[d]);
      if (parsed.success) entry[d] = parsed.data;
    }
    if (Object.keys(entry).length > 0) out[date] = entry;
  }
  return out;
}

/** Adds a result, keeping the best score for the same date + difficulty and only the last 90 days. */
export function recordDaily(log: DailyLog, date: string, difficulty: Difficulty, result: DailyResult): DailyLog {
  const prev = log[date]?.[difficulty];
  const keep = prev && prev.score > result.score ? prev : result;
  const next: DailyLog = { ...log, [date]: { ...log[date], [difficulty]: keep } };
  const dates = Object.keys(next).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete next[old];
  return next;
}

export const dailyDone = (log: DailyLog, date: string, difficulty: Difficulty): boolean => log[date]?.[difficulty] !== undefined;

function shiftDay(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Consecutive days with at least one Daily win, ending today (or yesterday while today is still open). */
export function dailyStreak(log: DailyLog, today: string): number {
  let day = log[today] ? today : shiftDay(today, -1);
  let n = 0;
  while (log[day]) {
    n++;
    day = shiftDay(day, -1);
  }
  return n;
}

/** Wordle-style share text: header plus a 9x9 grid (green = fine, red = a mistake was made there, white = given). */
export function shareText(
  date: string, difficulty: Difficulty, mode: Mode, result: DailyResult, puzzle: readonly number[], mistakeCells: ReadonlySet<number>,
): string {
  const rows: string[] = [];
  for (let r = 0; r < 9; r++) {
    let line = '';
    for (let c = 0; c < 9; c++) {
      const i = r * 9 + c;
      line += puzzle[i] !== 0 ? '⬜' : mistakeCells.has(i) ? '\u{1F7E5}' : '\u{1F7E9}';
    }
    rows.push(line);
  }
  const label = `${difficulty[0]?.toUpperCase() ?? ''}${difficulty.slice(1)} ${mode === 'dash' ? 'Dash' : 'Classic'}`;
  const score = mode === 'dash' ? ` | ${result.score} pts` : '';
  const head = `Sudoku Dash Daily ${date} | ${label} | ${formatElapsed(result.timeMs)}${score} | ${result.mistakes} mistake${result.mistakes === 1 ? '' : 's'}`;
  return [head, ...rows].join('\n');
}

export const loadDailyLog = (): DailyLog => parseDailyLog(readJson(KEYS.daily));
export const saveDailyLog = (l: DailyLog): void => writeJson(KEYS.daily, l);
