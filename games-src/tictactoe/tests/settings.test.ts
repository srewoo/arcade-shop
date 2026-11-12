import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, RESTART_KEYS, SETTING_KEYS, parseField, parseSettings } from '../src/settings';
import { coerceValue } from '../src/ui/chips';

describe('settings validation', () => {
  it('upgrades a v1 save (no new fields) by defaulting only the new ones', () => {
    const old = { opponent: 'human', level: 'hard', variant: 'vanishing', first: 'O', theme: 'dark', sound: false };
    expect(parseSettings(old)).toEqual({ ...DEFAULT_SETTINGS, ...old });
  });

  it('keeps the stored meaning of level "hard" (Unbeatable)', () => {
    expect(parseSettings({ level: 'hard' }).level).toBe('hard');
    expect(parseSettings({ level: 'strong' }).level).toBe('strong');
  });

  it('validates each new field separately', () => {
    const parsed = parseSettings({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'nope' });
    expect(parsed).toMatchObject({ volume: 40, reduceMotion: 'on', colorAssist: true, textSize: 150, theme: 'system' });
  });

  it.each([
    ['volume', 101], ['volume', -1], ['volume', 5.5], ['volume', '50'],
    ['textSize', 110], ['textSize', '125'], ['reduceMotion', 'maybe'], ['colorAssist', 'yes'],
  ] as const)('rejects %s = %s', (key, value) => {
    expect(parseField(key, value)).toBeUndefined();
    expect(parseSettings({ [key]: value })[key]).toBe(DEFAULT_SETTINGS[key]);
  });

  it('accepts boundary values', () => {
    expect(parseField('volume', 0)).toBe(0);
    expect(parseField('volume', 100)).toBe(100);
    expect(parseField('textSize', 125)).toBe(125);
  });

  it('ignores unknown keys and prototype pollution attempts', () => {
    const parsed = parseSettings(JSON.parse('{"__proto__":{"sound":false},"constructor":1,"x":1}'));
    expect(parsed).toEqual(DEFAULT_SETTINGS);
  });

  it('only opponent, variant and first restart a round', () => {
    expect([...RESTART_KEYS].sort()).toEqual(['first', 'opponent', 'variant']);
    expect(SETTING_KEYS).toEqual(expect.arrayContaining(['level', 'volume', 'sound', 'theme']));
  });

  it('maps DOM strings back to stored types', () => {
    expect(coerceValue('true')).toBe(true);
    expect(coerceValue('false')).toBe(false);
    expect(coerceValue('125')).toBe(125);
    expect(coerceValue('cpu')).toBe('cpu');
  });
});
