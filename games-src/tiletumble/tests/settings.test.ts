import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { EMPTY_STATS, bestFor, parseStats, recordResult } from '../src/stats';
import { CONFIG } from '../src/config';

describe('settings parsing', () => {
  it('returns defaults for junk input', () => {
    for (const raw of [null, undefined, 5, 'x', [], {}]) expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and falls back per field', () => {
    const s = parseSettings({ theme: 'dark', volume: 999, textSize: 125, reduceMotion: 'maybe', sound: 'yes', colorAssist: true, lastMode: 'daily' });
    expect(s).toMatchObject({ theme: 'dark', textSize: 125, colorAssist: true, lastMode: 'daily' });
    expect(s.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(s.reduceMotion).toBe('system');
    expect(s.sound).toBe(true);
  });
  it('ignores unknown keys', () => {
    expect(parseSettings({ evil: 1 })).toEqual(DEFAULT_SETTINGS);
  });
  it('validates single fields', () => {
    expect(parseField('textSize', 150)).toBe(150);
    expect(parseField('textSize', 130)).toBeUndefined();
    expect(parseField('volume', 55.5)).toBeUndefined();
    expect(parseField('theme', 'sepia')).toBeUndefined();
  });
});

describe('stats', () => {
  it('parses junk to empty stats and keeps valid fields', () => {
    expect(parseStats(null)).toEqual(EMPTY_STATS);
    const s = parseStats({ best: { classic: 40, moves: -1, endless: 'x' }, daily: { '2026-11-11': 12, bad: 3, '2026-11-12': -4 }, played: 3 });
    expect(s.best).toEqual({ classic: 40, moves: 0, endless: 0 });
    expect(s.daily).toEqual({ '2026-11-11': 12 });
    expect(s.played).toBe(3);
  });
  it('records a new best only when beaten', () => {
    const a = recordResult(EMPTY_STATS, 'classic', 30, '2026-11-11');
    expect(a.newBest).toBe(true);
    const b = recordResult(a.stats, 'classic', 20, '2026-11-11');
    expect(b.newBest).toBe(false);
    expect(b.stats.best.classic).toBe(30);
    expect(b.stats.played).toBe(2);
  });
  it('tracks the daily best per date and prunes old dates', () => {
    let s = EMPTY_STATS;
    for (let d = 1; d <= CONFIG.stats.dailyKeep + 5; d++) {
      s = recordResult(s, 'daily', d, `2026-01-${String(d).padStart(2, '0')}`.replace(/-(\d{3,})$/, '-99')).stats;
    }
    expect(Object.keys(s.daily).length).toBeLessThanOrEqual(CONFIG.stats.dailyKeep);
    const r = recordResult(EMPTY_STATS, 'daily', 9, '2026-11-11').stats;
    expect(bestFor(r, 'daily', '2026-11-11')).toBe(9);
    expect(bestFor(r, 'daily', '2026-11-12')).toBe(0);
  });
});
