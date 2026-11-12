import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SETTING_KEYS, parseField, parseSettings } from '../src/settings';
import { parseProgress, pruneDaily, recordResult, totalStars } from '../src/progress';
import { createRng, hashSeed } from '../src/rng';
import { dailyKey, dailyLevel, generateBridge } from '../src/puzzle/generate';
import { solve } from '../src/puzzle/solver';
import { starField } from '../src/art/sky';
import { keyAction, nthOnBank } from '../src/keys';
import { pickCast } from '../src/levels/cast';

describe('settings parsing', () => {
  it('returns defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const p = parseSettings({ volume: 20, theme: 'neon', textSize: 125, colorAssist: 'yes', reduceMotion: 'on', sound: false });
    expect(p).toMatchObject({ volume: 20, theme: 'system', textSize: 125, colorAssist: false, reduceMotion: 'on', sound: false });
  });
  it.each([['volume', 101], ['volume', -1], ['volume', 1.5], ['textSize', 110], ['reduceMotion', 'maybe'], ['sound', 1]] as const)(
    'rejects %s=%s', (k, v) => {
      expect(parseField(k, v)).toBeUndefined();
    });
  it('accepts boundaries and knows every key', () => {
    expect(parseField('volume', 0)).toBe(0);
    expect(parseField('volume', 100)).toBe(100);
    expect(SETTING_KEYS.sort()).toEqual(['colorAssist', 'reduceMotion', 'sound', 'textSize', 'theme', 'volume']);
  });
});

describe('progress', () => {
  it('parses per entry, dropping only the bad ones', () => {
    const raw = { v: 1, levels: { b01: { stars: 3, best: 8 }, b02: { stars: 9, best: 1 }, b03: 'x', 'BAD ID': { stars: 1, best: 1 }, b04: { stars: 1, best: 5, extra: 1 } } };
    expect(parseProgress(raw)).toEqual({ b01: { stars: 3, best: 8 } });
  });
  it('tolerates garbage', () => {
    expect(parseProgress(null)).toEqual({});
    expect(parseProgress({ levels: 5 })).toEqual({});
  });
  it('keeps the better result only', () => {
    let p = recordResult({}, 'b01', 2, 10);
    p = recordResult(p, 'b01', 1, 5);
    expect(p.b01).toEqual({ stars: 2, best: 10 });
    p = recordResult(p, 'b01', 2, 9);
    expect(p.b01).toEqual({ stars: 2, best: 9 });
    p = recordResult(p, 'b01', 3, 12);
    expect(p.b01).toEqual({ stars: 3, best: 12 });
    expect(totalStars(p, ['b01', 'b02'])).toBe(3);
  });
  it('prunes old daily rows only', () => {
    const p = { b01: { stars: 1, best: 1 }, 'daily-2026-01-01': { stars: 1, best: 1 }, 'daily-2026-01-02': { stars: 1, best: 1 }, 'daily-2026-01-03': { stars: 1, best: 1 } };
    expect(Object.keys(pruneDaily(p, 2)).sort()).toEqual(['b01', 'daily-2026-01-02', 'daily-2026-01-03']);
  });
});

describe('rng and daily puzzle', () => {
  it('same seed gives the same sequence, different seeds differ', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 8 }, () => a.next());
    expect(seqA).toEqual(Array.from({ length: 8 }, () => b.next()));
    expect(seqA).not.toEqual(Array.from({ length: 8 }, () => createRng(43).next()));
  });
  it('int stays inside bounds and pick returns members', () => {
    const r = createRng(1);
    for (let i = 0; i < 200; i++) expect(r.int(3, 6)).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 200; i++) expect(r.int(3, 6)).toBeLessThanOrEqual(6);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
  });
  it('hashSeed is stable', () => {
    expect(hashSeed('2026-11-11')).toBe(hashSeed('2026-11-11'));
    expect(hashSeed('2026-11-11')).not.toBe(hashSeed('2026-11-12'));
  });
  it('the daily level is deterministic per date and always solvable', () => {
    const d = new Date(2026, 10, 11);
    expect(dailyKey(d)).toBe('2026-11-11');
    expect(dailyLevel(d)).toEqual(dailyLevel(new Date(2026, 10, 11)));
    for (let seed = 1; seed <= 60; seed++) {
      const l = generateBridge(seed);
      expect(solve(l)?.cost).toBe(l.par);
      expect(l.limit).toBeGreaterThanOrEqual(l.par);
      expect(l.actors.length).toBeGreaterThanOrEqual(4);
      expect(new Set(l.actors.map((a) => a.time)).size).toBe(l.actors.length);
    }
  });
  it('daily levels vary between dates', () => {
    const keys = new Set(Array.from({ length: 20 }, (_, i) => generateBridge(i + 1).actors.map((a) => a.time).join(',')));
    expect(keys.size).toBeGreaterThan(10);
  });
  it('the star field is deterministic', () => {
    expect(starField(11)).toEqual(starField(11));
    expect(starField(11)).not.toEqual(starField(12));
  });
});

describe('keyboard map', () => {
  it('maps the documented keys', () => {
    expect(keyAction('p')).toEqual({ type: 'pause' });
    expect(keyAction('Escape')).toEqual({ type: 'pause' });
    expect(keyAction('M')).toEqual({ type: 'mute' });
    expect(keyAction('c')).toEqual({ type: 'cross' });
    expect(keyAction('3')).toEqual({ type: 'pick', n: 3 });
    expect(keyAction('0')).toBeNull();
    expect(keyAction('z')).toBeNull();
  });
  it('picks the nth traveller on the carrier bank', () => {
    expect(nthOnBank(0b10110, 5, 1)).toBe(1);
    expect(nthOnBank(0b10110, 5, 3)).toBe(4);
    expect(nthOnBank(0b10110, 5, 4)).toBeNull();
  });
});

describe('cast', () => {
  it('always includes the quickest and slowest, with no duplicates', () => {
    for (let n = 3; n <= 7; n++) {
      const c = pickCast(n);
      expect(c[0]?.name).toBe('Wren');
      expect(c[n - 1]?.name).toBe('Quill');
      expect(new Set(c.map((m) => m.name)).size).toBe(n);
    }
  });
});
