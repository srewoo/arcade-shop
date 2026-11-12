import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SettingsSchema, effectiveReduced, parseSettings } from '../src/settings';
import { withBest, recordResult } from '../src/progress';
import { emptyProgress } from '../src/settings';
import { sfxForOver } from '../src/sfxMap';
import { SFX_NAMES } from '../src/sfxNames';
import { Sfx } from '../src/audio';
import type { OverInfo } from '../src/gameTypes';
import { vi } from 'vitest';
import { timerSpeech } from '../src/srTimer';

describe('polish settings fields', () => {
  it('defaults match the conventions', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ volume: 80, reduceMotion: 'system', colorAssist: true, textSize: 100, seen: false });
    expect(SettingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });
  it('migrates a pre-polish save without losing it', () => {
    const s = parseSettings({ level: 'pro', theme: 'dark', sound: false });
    expect(s).toMatchObject({ level: 'pro', theme: 'dark', sound: false, volume: 80, textSize: 100, seen: false });
  });
  it('validates each new field independently', () => {
    const s = parseSettings({ volume: 140, reduceMotion: 'maybe', colorAssist: 'yes', textSize: 130, seen: 1, lastMode: 'x', level: 'pro' });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, level: 'pro' });
    expect(parseSettings({ volume: 35, reduceMotion: 'on', colorAssist: true, textSize: 150, seen: true, lastMode: 'cpu' }))
      .toMatchObject({ volume: 35, reduceMotion: 'on', colorAssist: true, textSize: 150, seen: true, lastMode: 'cpu' });
    expect(parseSettings({ volume: 33.5 }).volume).toBe(80);
    expect(parseSettings({ volume: -1 }).volume).toBe(80);
  });
  it('resolves reduce motion against the OS preference', () => {
    expect(effectiveReduced({ reduceMotion: 'system' }, true)).toBe(true);
    expect(effectiveReduced({ reduceMotion: 'system' }, false)).toBe(false);
    expect(effectiveReduced({ reduceMotion: 'on' }, false)).toBe(true);
    expect(effectiveReduced({ reduceMotion: 'off' }, true)).toBe(false);
  });
});

describe('new best', () => {
  const over = (score: number): OverInfo => ({ mode: 'rack', won: false, title: 't', detail: 'd', score, rack: 2 });
  it('flags a beaten record exactly once', () => {
    let p = { ...emptyProgress(), rackHigh: 1000 };
    const a = withBest(p, over(1500));
    expect(a.newBest).toBe(true); expect(a.best).toBe(1500);
    p = recordResult(p, a);
    const b = withBest(p, over(1500));
    expect(b.newBest).toBe(false); expect(b.best).toBe(1500);
    expect(withBest(p, over(900)).best).toBe(1500);
  });
  it('a first-ever zero score is not a record and other modes pass through', () => {
    expect(withBest(emptyProgress(), over(0)).newBest).toBe(false);
    const t: OverInfo = { mode: 'trick', won: true, title: 'x', detail: 'y', stars: 2 };
    expect(withBest(emptyProgress(), t)).toBe(t);
  });
});

describe('sound mapping', () => {
  const infos: OverInfo[] = [
    { mode: 'rack', won: false, title: '', detail: '', newBest: false },
    { mode: 'rack', won: false, title: '', detail: '', newBest: true },
    { mode: 'trick', won: true, title: '', detail: '', stars: 3 },
    { mode: 'trick', won: false, title: '', detail: '', stars: 0 },
    { mode: 'cpu', won: true, title: '', detail: '' },
    { mode: 'cpu', won: false, title: '', detail: '' },
    { mode: 'duo', won: true, title: '', detail: '' },
  ];
  it('every game-over outcome maps to at least one known sound', () => {
    for (const i of infos) {
      const calls = sfxForOver(i);
      expect(calls.length).toBeGreaterThan(0);
      for (const c of calls) expect(SFX_NAMES).toContain(c.name);
    }
    expect(sfxForOver(infos[2]!).map((c) => c.name)).toEqual(['win', 'star']);
    expect(sfxForOver(infos[2]!)[1]!.n).toBe(3);
  });
  it('Sfx.play dispatches every sound name to its synth method', () => {
    const s = new Sfx();
    for (const name of SFX_NAMES) {
      const spy = vi.spyOn(Sfx.prototype, name === 'ui' ? 'ui' : name);
      s.play(name, 2);
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    }
  });
  it('a muted Sfx never creates an audio context', () => {
    const s = new Sfx();
    s.muted = true;
    expect(() => { for (const n of SFX_NAMES) s.play(n, 1); s.clack(500); s.pot(); }).not.toThrow();
  });
});

describe('screen-reader timer', () => {
  it('speaks the first value, then only every 10 s and at 5, 3, 2, 1', () => {
    const said: string[] = [];
    let prev: number | null = null;
    for (let t = 35; t > 0; t -= 0.1) {
      const sp = timerSpeech(prev, t);
      if (sp) said.push(sp);
      prev = t;
    }
    expect(said).toEqual(['35 seconds left', '30 seconds left', '20 seconds left', '10 seconds left', '5 seconds left', '3 seconds left', '2 seconds left', '1 seconds left']);
  });
  it('is quiet when there is no clock', () => {
    expect(timerSpeech(null, null)).toBeNull();
    expect(timerSpeech(10, null)).toBeNull();
  });
  it('keeps live-region churn to a handful of updates for a 3 s window', () => {
    let n = 0; let prev: number | null = 34.0;
    for (let t = 34; t > 31; t -= 0.1) { if (timerSpeech(prev, t)) n++; prev = t; }
    expect(n).toBeLessThanOrEqual(1);
  });
});
