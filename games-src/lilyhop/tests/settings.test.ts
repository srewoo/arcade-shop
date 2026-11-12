import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';

describe('settings parsing', () => {
  it('uses defaults for non-objects', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(7)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps good fields and falls back on bad ones individually', () => {
    const s = parseSettings({ volume: 30, theme: 'purple', textSize: 125, sound: 'yes', reduceMotion: 'on', colorAssist: true });
    expect(s).toMatchObject({ volume: 30, theme: 'system', textSize: 125, sound: true, reduceMotion: 'on', colorAssist: true });
  });
  it('rejects out-of-range volume and non-integers', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 2.5)).toBeUndefined();
    expect(parseField('volume', 0)).toBe(0);
  });
  it('only accepts the three text sizes', () => {
    expect(parseField('textSize', 100)).toBe(100);
    expect(parseField('textSize', 110)).toBeUndefined();
  });
  it('ignores unknown keys', () => {
    expect(parseSettings({ evil: 1 })).toEqual(DEFAULT_SETTINGS);
  });
});
