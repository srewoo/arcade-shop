import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';

describe('settings parsing', () => {
  it('returns defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(42)).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and falls back per field', () => {
    const s = parseSettings({ theme: 'dark', volume: 999, textSize: 125, sound: 'yes', reduceMotion: 'on', colorAssist: true, touchControls: 'huh', extra: 1 });
    expect(s.theme).toBe('dark');
    expect(s.volume).toBe(DEFAULT_SETTINGS.volume);
    expect(s.textSize).toBe(125);
    expect(s.sound).toBe(true);
    expect(s.reduceMotion).toBe('on');
    expect(s.colorAssist).toBe(true);
    expect(s.touchControls).toBe('auto');
    expect('extra' in s).toBe(false);
  });
  it('validates single fields', () => {
    expect(parseField('volume', 40)).toBe(40);
    expect(parseField('volume', 40.5)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('theme', 'sepia')).toBeUndefined();
    expect(parseField('touchControls', 'on')).toBe('on');
  });
});
