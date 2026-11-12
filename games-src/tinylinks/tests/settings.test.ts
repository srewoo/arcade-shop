import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { coerceValue } from '../src/ui/settingsPanel';
import { parseBest, parseSetup, DEFAULT_SETUP } from '../src/setupStore';
import { readFlag, readJson, writeFlag, writeJson } from '../src/storage';
import { isReducedMotion } from '../src/ui/appearance';

describe('settings validation', () => {
  it('falls back per field', () => {
    const p = parseSettings({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'nope' });
    expect(p).toMatchObject({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'system' });
  });
  it.each([['volume', 101], ['volume', -1], ['volume', 5.5], ['volume', '50'], ['textSize', 110], ['reduceMotion', 'maybe'], ['colorAssist', 'yes']] as const)(
    'rejects %s = %s', (k, v) => {
      expect(parseField(k, v)).toBeUndefined();
      expect(parseSettings({ [k]: v })[k]).toBe(DEFAULT_SETTINGS[k]);
    });
  it('handles junk and prototype pollution', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.parse('{"__proto__":{"sound":false},"x":1}'))).toEqual(DEFAULT_SETTINGS);
  });
  it('coerces DOM values', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('125')).toBe(125);
    expect(coerceValue('system')).toBe('system');
  });
  it('reduce motion follows the system unless overridden', () => {
    expect(isReducedMotion('system', true)).toBe(true);
    expect(isReducedMotion('system', false)).toBe(false);
    expect(isReducedMotion('on', false)).toBe(true);
    expect(isReducedMotion('off', true)).toBe(false);
  });
});

describe('setup + best storage validation', () => {
  it('keeps a valid setup and de-duplicates colours', () => {
    const s = parseSetup({ course: 'all18', players: [{ name: ' Ann ', color: 'sky' }, { name: 'Bo', color: 'sky' }] });
    expect(s.course).toBe('all18');
    expect(s.players[0]?.name).toBe('Ann');
    expect(new Set(s.players.map((p) => p.color)).size).toBe(2);
  });
  it.each([null, 5, 'x', { course: 'x', players: [] }, { course: 'front9', players: [] }, { course: 'front9', players: [{ name: 'a', color: 'plaid' }] },
    { course: 'front9', players: [{ name: 'a', color: 'sky', extra: 1 }] }, { course: 'front9', players: Array.from({ length: 5 }, () => ({ name: 'a', color: 'sky' })) }])(
    'falls back to the default for %j', (raw) => {
      expect(parseSetup(raw).course).toBe(DEFAULT_SETUP.course);
      expect(parseSetup(raw).players).toHaveLength(1);
    });
  it('validates best scores', () => {
    expect(parseBest({ front9: 30, all18: 60 })).toEqual({ front9: 30, all18: 60 });
    expect(parseBest({ front9: -3 })).toEqual({});
    expect(parseBest({ nine: 3 })).toEqual({});
    expect(parseBest('x')).toEqual({});
  });
});

describe('storage never throws', () => {
  beforeEach(() => { (globalThis as { localStorage?: unknown }).localStorage = undefined; });
  it('swallows a missing localStorage', () => {
    expect(readJson('k')).toBeNull();
    expect(writeJson('k', { a: 1 })).toBe(false);
    expect(readFlag('k')).toBe(false);
    expect(() => writeFlag('k')).not.toThrow();
  });
});
