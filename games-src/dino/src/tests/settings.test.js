import { describe, it, expect } from 'vitest';
import { defaultSettings, parseSettings, serializeSettings, difficultyMult, shakeScale, DIFFICULTIES, effectiveReducedMotion, TEXT_SCALES } from '../settings.js';
import { qualityPlan } from '../qualityLevels.js';

const D = defaultSettings();

describe('parseSettings', () => {
  it('returns defaults for missing, malformed or non-object input', () => {
    for (const raw of [null, undefined, '', 'not json', '[1,2]', '42', 'null', 7, true]) expect(parseSettings(raw)).toEqual(D);
  });
  it('round-trips valid settings', () => {
    const s = {
      mode: 'zen', difficulty: 'hard', volume: 0.35, quality: 'low', shake: false, motion: 'on', reducedMotion: true, colorAssist: true, textScale: 1.25,
      theme: 'dark', muted: true, seenHints: ['duck'], unlockedSkins: ['ember'], powerups: false, classicPlus: true, skin: 'classic', weather: 'rain',
    };
    expect(parseSettings(serializeSettings(s))).toEqual(s);
  });
  it('replaces each unknown or wrongly typed field with its default', () => {
    const out = parseSettings({
      mode: 'bogus', difficulty: 'insane', volume: 'loud', quality: 'ultra', shake: 'yes', motion: 'maybe', reducedMotion: 1, powerups: null, classicPlus: 'true',
      skin: 'neon', weather: 'storm', colorAssist: 'yes', textScale: 3, theme: 'purple', muted: 1, seenHints: 'duck', unlockedSkins: [1, 'nope'],
    });
    expect(out).toEqual(D);
  });
  it('keeps valid fields when others are bad', () => {
    expect(parseSettings({ difficulty: 'easy', volume: 'x', mode: 'timeattack' })).toMatchObject({ difficulty: 'easy', mode: 'timeattack', volume: D.volume });
  });
  it('clamps volume to 0..1 and rejects non-finite numbers', () => {
    expect(parseSettings({ volume: 5 }).volume).toBe(1);
    expect(parseSettings({ volume: -1 }).volume).toBe(0);
    expect(parseSettings({ volume: 0.123456 }).volume).toBe(0.12);
    expect(parseSettings({ volume: Infinity }).volume).toBe(D.volume);
    expect(parseSettings('{"volume":null}').volume).toBe(D.volume);
  });
  it('drops unknown keys and ignores prototype pollution attempts', () => {
    const out = parseSettings('{"__proto__":{"admin":true},"extra":1,"mode":"zen"}');
    expect(Object.keys(out).sort()).toEqual(Object.keys(D).sort());
    expect(out.admin).toBeUndefined();
    expect({}.admin).toBeUndefined();
  });
  it('honours custom defaults (prefers-reduced-motion)', () => {
    const d = defaultSettings({ prefersReducedMotion: true });
    expect(parseSettings(null, d).reducedMotion).toBe(true);
    expect(parseSettings({ reducedMotion: false }, d).reducedMotion).toBe(false);
  });
  it('treats Reduce motion as System / On / Off and maps the legacy boolean', () => {
    const os = defaultSettings({ prefersReducedMotion: true });
    expect(D.motion).toBe('system');
    expect(parseSettings({ motion: 'off' }, os)).toMatchObject({ motion: 'off', reducedMotion: false });
    expect(parseSettings({ motion: 'on' }, D)).toMatchObject({ motion: 'on', reducedMotion: true });
    expect(parseSettings({ motion: 'system' }, os)).toMatchObject({ motion: 'system', reducedMotion: true });
    expect(parseSettings({ reducedMotion: true }, D).motion).toBe('on'); // legacy save, user ticked the box
    expect(parseSettings({ reducedMotion: false }, D).motion).toBe('system'); // legacy default, follow the OS
    expect(parseSettings({ reducedMotion: false }, os).motion).toBe('off'); // OS asks for less motion but the player turned it off
    expect(effectiveReducedMotion('system', true)).toBe(true);
    expect(effectiveReducedMotion('system', false)).toBe(false);
    expect(effectiveReducedMotion('off', true)).toBe(false);
    expect(effectiveReducedMotion('on', false)).toBe(true);
  });
  it('validates the new accessibility fields one by one', () => {
    expect(parseSettings({ textScale: 1.5 }).textScale).toBe(1.5);
    expect(parseSettings({ textScale: 1.3 }).textScale).toBe(1);
    expect(parseSettings({ textScale: '1.25' }).textScale).toBe(1);
    expect(TEXT_SCALES).toEqual([1, 1.25, 1.5]);
    expect(parseSettings({ theme: 'dark' }).theme).toBe('dark');
    expect(parseSettings({ theme: 'neon' }).theme).toBe('system');
    expect(parseSettings({ muted: true }).muted).toBe(true);
    expect(parseSettings({ muted: 'true' }).muted).toBe(false);
    expect(parseSettings({ colorAssist: true }).colorAssist).toBe(true);
  });
  it('keeps only known, unique hint and skin ids', () => {
    expect(parseSettings({ seenHints: ['duck', 'duck', 'bogus', 3, 'jump'] }).seenHints).toEqual(['duck', 'jump']);
    expect(parseSettings({ seenHints: { 0: 'duck' } }).seenHints).toEqual([]);
    expect(parseSettings({ unlockedSkins: ['royal', 'royal', 'neon'] }).unlockedSkins).toEqual(['royal']);
  });
  it('persists mute across a save / load round trip', () => {
    const s = { ...D, muted: true };
    expect(parseSettings(serializeSettings(s)).muted).toBe(true);
  });
});

describe('derived values', () => {
  it('maps difficulty to a speed multiplier and falls back to 1', () => {
    expect(difficultyMult('easy')).toBeLessThan(1);
    expect(difficultyMult('normal')).toBe(1);
    expect(difficultyMult('hard')).toBeGreaterThan(1);
    expect(difficultyMult('weird')).toBe(1);
    expect(Object.keys(DIFFICULTIES)).toEqual(['easy', 'normal', 'hard']);
  });
  it('disables shake when off or reduced motion is on', () => {
    expect(shakeScale({ shake: true, reducedMotion: false })).toBe(1);
    expect(shakeScale({ shake: false, reducedMotion: false })).toBe(0);
    expect(shakeScale({ shake: true, reducedMotion: true })).toBe(0);
  });
  it('plans graphics quality', () => {
    expect(qualityPlan('auto', 2)).toEqual({ pixelRatio: 2, shadows: true, adaptive: true });
    expect(qualityPlan('high', 2).adaptive).toBe(false);
    expect(qualityPlan('medium', 2).pixelRatio).toBe(1.25);
    expect(qualityPlan('medium', 1).pixelRatio).toBe(1);
    expect(qualityPlan('low', 2)).toEqual({ pixelRatio: 1, shadows: false, adaptive: false });
    expect(qualityPlan('???', 1.5).adaptive).toBe(true);
  });
});
