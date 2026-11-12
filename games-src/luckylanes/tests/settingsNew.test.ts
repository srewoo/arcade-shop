import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, emptyHighScores, parseHighScores, parseSettings, SettingsSchema } from '../src/settings';

describe('settings: new fields', () => {
  it('defaults match the conventions', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ volume: 80, reduceMotion: 'system', cbAssist: false, textSize: 100, widePocket: false, fastCpu: false, seenIntro: false, throws: 0, cpuLevel: 'casual' });
    expect(SettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
  it('loads an old save (five fields) without losing it', () => {
    const old = { mode: 'hotseat', players: 3, cpuLevel: 'pro', theme: 'dark', sound: false };
    expect(parseSettings(old)).toEqual({ ...DEFAULT_SETTINGS, ...old });
  });
  it('validates every new field independently', () => {
    const s = parseSettings({ volume: 140, reduceMotion: 'maybe', cbAssist: 'yes', textSize: 130, widePocket: true, fastCpu: 1, seenIntro: true, throws: -4, mode: 'spare' });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, widePocket: true, seenIntro: true, mode: 'spare' });
  });
  it('accepts valid values at the edges', () => {
    const s = parseSettings({ volume: 0, reduceMotion: 'on', textSize: 150, cbAssist: true, throws: 1000, cpuLevel: 'easy' });
    expect(s).toMatchObject({ volume: 0, reduceMotion: 'on', textSize: 150, cbAssist: true, throws: 1000, cpuLevel: 'easy' });
    expect(parseSettings({ volume: 50.5 }).volume).toBe(80);
  });
  it('high scores gain a casual table and keep old tables', () => {
    expect(emptyHighScores().cpuCasual).toEqual([]);
    const hs = parseHighScores({ solo: [{ score: 120, at: 5 }], cpuEasy: [{ score: 90, at: 6 }] });
    expect(hs.solo).toEqual([{ score: 120, at: 5 }]);
    expect(hs.cpuEasy).toHaveLength(1);
    expect(hs.cpuCasual).toEqual([]);
  });
});
