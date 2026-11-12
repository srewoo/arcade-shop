import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { parseProgress, recordBest, totalStars, unlockedUpTo } from '../src/progress';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { createStopwatch, formatTime } from '../src/timer';

describe('settings parsing', () => {
  it('defaults on junk input', () => {
    for (const raw of [null, undefined, 5, 'x', []]) expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and falls back per field', () => {
    const s = parseSettings({ theme: 'dark', volume: 999, textSize: 125, reduceMotion: 'maybe', sound: 'yes', colorAssist: true });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, theme: 'dark', textSize: 125, colorAssist: true });
  });
  it('ignores unknown keys and rejects bad field values', () => {
    expect(parseSettings({ evil: 1 })).toEqual(DEFAULT_SETTINGS);
    expect(parseField('volume', 50.5)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('textSize', 150)).toBe(150);
    expect(parseField('reduceMotion', 'on')).toBe('on');
  });
});

describe('progress', () => {
  const n = LEVELS.length;
  it('parses per entry and drops invalid ones', () => {
    const p = parseProgress({ '1': { stars: 3, moves: 4 }, '2': { stars: 9, moves: 4 }, '3': 'x', '99': { stars: 1, moves: 1 }, '4': { stars: 2, moves: 0 } }, n);
    expect(p).toEqual({ 1: { stars: 3, moves: 4 } });
    expect(parseProgress(null, n)).toEqual({});
    expect(parseProgress('bad', n)).toEqual({});
  });
  it('keeps the best result only', () => {
    let p = recordBest({}, 1, 2, 9);
    p = recordBest(p, 1, 1, 3);
    expect(p[1]).toEqual({ stars: 2, moves: 9 });
    p = recordBest(p, 1, 2, 7);
    expect(p[1]).toEqual({ stars: 2, moves: 7 });
    p = recordBest(p, 1, 3, 20);
    expect(p[1]).toEqual({ stars: 3, moves: 20 });
    expect(totalStars(p)).toBe(3);
  });
  it('unlocks a few levels past the first unfinished one', () => {
    expect(unlockedUpTo({}, n)).toBe(4);
    expect(unlockedUpTo({ 1: { stars: 1, moves: 1 }, 2: { stars: 1, moves: 1 } }, n)).toBe(6);
    const all = Object.fromEntries(LEVELS.map((l) => [l.id, { stars: 1, moves: 1 }]));
    expect(unlockedUpTo(all as never, n)).toBe(n);
  });
});

describe('stopwatch', () => {
  it('accumulates only while running', () => {
    let t = 0;
    const sw = createStopwatch(() => t);
    sw.start();
    t = 1500;
    sw.stop();
    t = 9000;
    expect(sw.elapsedMs()).toBe(1500);
    sw.start();
    sw.start();
    t = 10000;
    expect(sw.elapsedMs()).toBe(2500);
    sw.reset();
    expect(sw.elapsedMs()).toBe(0);
    expect(sw.running).toBe(false);
  });
  it('formats m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65_900)).toBe('1:05');
  });
});
