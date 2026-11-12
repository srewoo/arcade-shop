import { describe, expect, it } from 'vitest';
import { parseGrid } from '../src/core/grid';
import { dailyDone, dailyStreak, parseDailyLog, recordDaily, shareText, type DailyLog, type DailyResult } from '../src/daily';
import { PUZZLE } from './fixtures';

const res = (score: number, over: Partial<DailyResult> = {}): DailyResult => ({ mode: 'dash', score, timeMs: 125_000, mistakes: 1, ...over });

describe('daily log', () => {
  it('validates entries and drops junk', () => {
    const log = parseDailyLog({
      '2026-11-10': { easy: res(100), hard: { mode: 'dash', score: -1, timeMs: 5, mistakes: 0 } },
      'not-a-date': { easy: res(1) },
      '2026-11-09': 'nope',
    });
    expect(Object.keys(log)).toEqual(['2026-11-10']);
    expect(log['2026-11-10']?.easy?.score).toBe(100);
    expect(log['2026-11-10']?.hard).toBeUndefined();
    expect(parseDailyLog(null)).toEqual({});
    expect(parseDailyLog([1, 2])).toEqual({});
  });

  it('keeps the better score for the same date and difficulty, and marks it done', () => {
    let log: DailyLog = recordDaily({}, '2026-11-11', 'hard', res(500));
    log = recordDaily(log, '2026-11-11', 'hard', res(300));
    expect(log['2026-11-11']?.hard?.score).toBe(500);
    log = recordDaily(log, '2026-11-11', 'hard', res(900));
    expect(log['2026-11-11']?.hard?.score).toBe(900);
    expect(dailyDone(log, '2026-11-11', 'hard')).toBe(true);
    expect(dailyDone(log, '2026-11-11', 'easy')).toBe(false);
    expect(dailyDone(log, '2026-11-12', 'hard')).toBe(false);
  });

  it('keeps only the last 90 days', () => {
    let log: DailyLog = {};
    for (let i = 0; i < 100; i++) log = recordDaily(log, `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`, 'easy', res(i));
    expect(Object.keys(log).length).toBe(90);
  });
});

describe('daily streak', () => {
  const day = (...d: string[]): DailyLog => Object.fromEntries(d.map((k) => [k, { easy: res(1) }]));
  it('counts consecutive days ending today', () => {
    expect(dailyStreak(day('2026-11-09', '2026-11-10', '2026-11-11'), '2026-11-11')).toBe(3);
  });
  it('stays alive until today is over (yesterday counts)', () => {
    expect(dailyStreak(day('2026-11-09', '2026-11-10'), '2026-11-11')).toBe(2);
  });
  it('a gap resets it, and no wins means zero', () => {
    expect(dailyStreak(day('2026-11-08', '2026-11-10', '2026-11-11'), '2026-11-11')).toBe(2);
    expect(dailyStreak(day('2026-11-01'), '2026-11-11')).toBe(0);
    expect(dailyStreak({}, '2026-11-11')).toBe(0);
  });
  it('crosses month and year boundaries', () => {
    expect(dailyStreak(day('2026-12-31', '2027-01-01'), '2027-01-01')).toBe(2);
    expect(dailyStreak(day('2026-02-28', '2026-03-01'), '2026-03-01')).toBe(2);
  });
});

describe('share text', () => {
  it('builds a header and a 9x9 grid marking givens, clean cells and mistakes', () => {
    const puzzle = parseGrid(PUZZLE) as number[];
    const text = shareText('2026-11-11', 'hard', 'dash', res(1234, { mistakes: 2 }), puzzle, new Set([2, 3]));
    const lines = text.split('\n');
    expect(lines[0]).toBe('Sudoku Dash Daily 2026-11-11 | Hard Dash | 2:05 | 1234 pts | 2 mistakes');
    expect(lines).toHaveLength(10);
    const first = [...(lines[1] as string)];
    expect(first).toHaveLength(9);
    expect(first[0]).toBe('⬜');
    expect(first[2]).toBe('\u{1F7E5}');
    expect(first[5]).toBe('\u{1F7E9}');
  });

  it('omits the score for Classic and singularises one mistake', () => {
    const text = shareText('2026-11-11', 'easy', 'classic', res(0, { mode: 'classic', mistakes: 1 }), parseGrid(PUZZLE) as number[], new Set());
    expect(text.split('\n')[0]).toBe('Sudoku Dash Daily 2026-11-11 | Easy Classic | 2:05 | 1 mistake');
  });
});
