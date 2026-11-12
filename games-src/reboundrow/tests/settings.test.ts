import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseField, parseSettings } from '../src/settings';
import { DEFAULT_PROGRESS, parseProgress, recordCampaign, recordEndless } from '../src/progress';
import { LEVEL_COUNT } from '../src/levels';

describe('settings parsing', () => {
  it('returns defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });
  it('falls back per field', () => {
    const s = parseSettings({ volume: 30, theme: 'neon', textSize: 125, sound: 'yes', reduceMotion: 'on', colorAssist: true });
    expect(s.volume).toBe(30);
    expect(s.theme).toBe('system');
    expect(s.textSize).toBe(125);
    expect(s.sound).toBe(true);
    expect(s.reduceMotion).toBe('on');
    expect(s.colorAssist).toBe(true);
  });
  it('rejects out of range values', () => {
    expect(parseField('volume', 101)).toBeUndefined();
    expect(parseField('volume', -1)).toBeUndefined();
    expect(parseField('volume', 2.5)).toBeUndefined();
    expect(parseField('textSize', 110)).toBeUndefined();
    expect(parseField('volume', 0)).toBe(0);
  });
});

describe('progress parsing', () => {
  it('defaults, per-field fallback and clamping', () => {
    expect(parseProgress(undefined)).toEqual(DEFAULT_PROGRESS);
    const p = parseProgress({ unlocked: 9999, bestCampaign: -5, bestEndless: 120, bestEndlessLevel: 'x' });
    expect(p.unlocked).toBe(LEVEL_COUNT);
    expect(p.bestCampaign).toBe(0);
    expect(p.bestEndless).toBe(120);
    expect(p.bestEndlessLevel).toBe(0);
  });
  it('records unlocks and bests without going down', () => {
    let p = recordCampaign(DEFAULT_PROGRESS, 1, 500);
    expect(p.unlocked).toBe(2);
    p = recordCampaign(p, 1, 100);
    expect(p.unlocked).toBe(2);
    expect(p.bestCampaign).toBe(500);
    expect(recordCampaign(p, LEVEL_COUNT, 1).unlocked).toBe(LEVEL_COUNT);
    p = recordEndless(p, 4, 900);
    expect(recordEndless(p, 2, 10)).toMatchObject({ bestEndless: 900, bestEndlessLevel: 4 });
  });
});
