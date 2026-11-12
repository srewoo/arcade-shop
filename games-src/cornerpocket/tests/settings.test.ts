import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, ProgressSchema, SettingsSchema, emptyProgress, parseProgress, parseSettings } from '../src/settings';

describe('settings validation', () => {
  it('falls back to defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults invalid ones', () => {
    const s = parseSettings({ level: 'pro', theme: 'purple', sound: 'yes' });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, level: 'pro' });
  });
  it('strict schema rejects unknown keys', () => {
    expect(SettingsSchema.safeParse({ ...DEFAULT_SETTINGS, extra: 1 }).success).toBe(false);
    expect(SettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
});

describe('progress validation', () => {
  it('accepts a valid record', () => {
    const p = { ...emptyProgress(), rackHigh: 1200, stars: [3, 2, 1, ...new Array<number>(12).fill(0)] };
    expect(ProgressSchema.safeParse(p).success).toBe(true);
    expect(parseProgress(p)).toEqual(p);
  });
  it('rejects bad star arrays and negative scores field by field', () => {
    const p = parseProgress({ rackHigh: -4, rackBest: 3, stars: [9, 1], cpuWins: 2.5, cpuLosses: 1 });
    expect(p.rackHigh).toBe(0);
    expect(p.rackBest).toBe(3);
    expect(p.stars).toEqual(emptyProgress().stars);
    expect(p.cpuWins).toBe(0);
    expect(p.cpuLosses).toBe(1);
  });
  it('handles non-objects', () => {
    expect(parseProgress(undefined)).toEqual(emptyProgress());
  });
});

import { recordResult } from '../src/progress';

describe('recordResult', () => {
  it('keeps the best rack score and star count', () => {
    let p = recordResult(emptyProgress(), { mode: 'rack', won: false, title: '', detail: '', score: 900, rack: 3 });
    p = recordResult(p, { mode: 'rack', won: false, title: '', detail: '', score: 400, rack: 2 });
    expect(p.rackHigh).toBe(900);
    expect(p.rackBest).toBe(3);
    p = recordResult(p, { mode: 'trick', won: true, title: '', detail: '', trick: 4, stars: 3 });
    p = recordResult(p, { mode: 'trick', won: true, title: '', detail: '', trick: 4, stars: 1 });
    expect(p.stars[4]).toBe(3);
    p = recordResult(p, { mode: 'cpu', won: true, title: '', detail: '' });
    p = recordResult(p, { mode: 'cpu', won: false, title: '', detail: '' });
    expect([p.cpuWins, p.cpuLosses]).toEqual([1, 1]);
    expect(ProgressSchema.safeParse(p).success).toBe(true);
  });
});
