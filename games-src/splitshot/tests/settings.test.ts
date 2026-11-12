import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { coerceValue } from '../src/ui/settingsPanel';

describe('settings', () => {
  it('falls back to defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and defaults only the bad ones', () => {
    const s = parseSettings({ volume: 30, theme: 'purple', textSize: 125, sound: 'yes', reduceMotion: 'on' });
    expect(s.volume).toBe(30);
    expect(s.theme).toBe('system');
    expect(s.textSize).toBe(125);
    expect(s.sound).toBe(true);
    expect(s.reduceMotion).toBe('on');
  });
  it('rejects out-of-range volume and sizes', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', 1.5)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
  });
  it('coerces DOM data-values', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('125')).toBe(125);
    expect(coerceValue('system')).toBe('system');
  });
});
