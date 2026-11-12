import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';

describe('settings parsing', () => {
  it('returns defaults for junk input', () => {
    for (const raw of [null, undefined, 'x', 5, [], {}]) expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const out = parseSettings({ volume: 30, theme: 'neon', textSize: 125, reduceMotion: 'on', colorAssist: 'yes', mode: 'daily', sound: false });
    expect(out.volume).toBe(30);
    expect(out.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(out.textSize).toBe(125);
    expect(out.reduceMotion).toBe('on');
    expect(out.colorAssist).toBe(false);
    expect(out.mode).toBe('daily');
    expect(out.sound).toBe(false);
  });
  it('rejects out-of-range and non-integer volume and odd text sizes', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 12.5)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('volume', 0)).toBe(0);
  });
  it('ignores unknown keys', () => {
    expect(parseSettings({ evil: 1, volume: 10 }).volume).toBe(10);
  });
});
