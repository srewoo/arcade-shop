import { describe, expect, it } from 'vitest';
import { ACTIONS, DEFAULT_KEYS, DEFAULT_SETTINGS, MAX_KEYS_PER_ACTION, isBetter, parseRecords, parseSettings, rebind, rebindKey, type Keys } from '../src/settings';

describe('settings validation', () => {
  it('falls back to defaults for junk', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ das: 'fast', ghost: 3 })).toEqual(DEFAULT_SETTINGS);
  });
  it('keeps valid fields and rejects out-of-range ones', () => {
    const s = parseSettings({ das: 120, arr: 9999, sound: false });
    expect(s.das).toBe(120);
    expect(s.arr).toBe(DEFAULT_SETTINGS.arr);
    expect(s.sound).toBe(false);
  });
  it('shows touch buttons by default on touch devices, but a saved choice wins', () => {
    expect(parseSettings(null, true).touchButtons).toBe(true);
    expect(parseSettings(null, false).touchButtons).toBe(false);
    expect(parseSettings({ touchButtons: false }, true).touchButtons).toBe(false);
    expect(parseSettings({ touchButtons: 'yes' }, true).touchButtons).toBe(true);
  });
  it('rebinding moves a key between actions', () => {
    const keys = rebind(DEFAULT_SETTINGS.keys, 'stash', 'KeyA');
    expect(keys.stash).toEqual(['KeyA']);
    expect(keys.left).not.toContain('KeyA');
  });
  it('records validate and compare by mode type', () => {
    expect(parseRecords({ marathon: -5 }).marathon).toBeNull();
    expect(parseRecords({ sprint: 41000 }).sprint).toBe(41000);
    expect(isBetter('marathon', 100, 50)).toBe(true);
    expect(isBetter('sprint', 40000, 41000)).toBe(true);
    expect(isBetter('sprint', 40000, null)).toBe(true);
  });
});

describe('new settings fields (polish pass)', () => {
  it('validates each new field independently and falls back per field', () => {
    const s = parseSettings({ masterVolume: 150, sfxVolume: 40, musicVolume: -1, muted: 'no', textSize: 125, particles: 'lots', swipeStep: 5, tuning: 'tuned', colorAssist: true, haptics: true });
    expect(s.masterVolume).toBe(DEFAULT_SETTINGS.masterVolume);
    expect(s.sfxVolume).toBe(40);
    expect(s.musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
    expect(s.muted).toBe(false);
    expect(s.textSize).toBe(125);
    expect(s.particles).toBe('full');
    expect(s.swipeStep).toBe(14);
    expect(s.tuning).toBe('tuned');
    expect(s.colorAssist).toBe(true);
    expect(s.haptics).toBe(true);
  });
  it('rejects text sizes outside 100/125/150', () => {
    expect(parseSettings({ textSize: 110 }).textSize).toBe(100);
    expect(parseSettings({ textSize: '150' }).textSize).toBe(100);
  });
  it('old saved settings without the new keys still load (no data loss)', () => {
    const old = { keys: DEFAULT_KEYS, das: 100, arr: 20, ghost: false, sound: true, music: false, touchButtons: true, reducedMotion: 'on', mode: 'sprint', startLevel: 4, zenGarbage: true };
    const s = parseSettings(old);
    expect(s).toMatchObject({ das: 100, arr: 20, ghost: false, music: false, mode: 'sprint', startLevel: 4, reducedMotion: 'on', zenGarbage: true });
    expect(s.masterVolume).toBe(100);
  });
  it('a corrupt keys object falls back to the default keys', () => {
    expect(parseSettings({ keys: { left: [] } }).keys).toEqual(DEFAULT_KEYS);
  });
});

describe('rebinding never leaves an action unbound (STACKFALL-16)', () => {
  it('swaps instead of emptying: Space to Rotate gives Hard drop the old rotate keys', () => {
    const r = rebindKey(DEFAULT_KEYS as Keys, 'rotCW', 'Space');
    expect(r.ok).toBe(true);
    expect(r.swapped).toBe('hardDrop');
    expect(r.keys.rotCW).toEqual(['Space']);
    expect(r.keys.hardDrop).toEqual(['ArrowUp', 'KeyX', 'KeyW']);
  });
  it('Mute and Rotate CCW survive being stolen', () => {
    expect(rebind(DEFAULT_KEYS as Keys, 'stash', 'KeyM').mute.length).toBeGreaterThan(0);
    expect(rebind(DEFAULT_KEYS as Keys, 'left', 'KeyZ').rotCCW.length).toBeGreaterThan(0);
  });
  it('blocks Tab, Enter and Meta keys', () => {
    for (const code of ['Tab', 'Enter', 'MetaLeft']) {
      const r = rebindKey(DEFAULT_KEYS as Keys, 'stash', code);
      expect(r.ok).toBe(false);
      expect(r.keys).toEqual(DEFAULT_KEYS);
      expect(r.message).toBeTruthy();
    }
  });
  it('add mode keeps alternates, caps at four and rejects an emptying steal', () => {
    const added = rebindKey(DEFAULT_KEYS as Keys, 'hardDrop', 'KeyV', 'add');
    expect(added.keys.hardDrop).toEqual(['Space', 'KeyV']);
    const full = rebindKey(DEFAULT_KEYS as Keys, 'rotCW', 'KeyQ', 'add').keys;
    const capped = rebindKey(full, 'rotCW', 'KeyE', 'add');
    expect(capped.ok).toBe(false);
    const steal = rebindKey(DEFAULT_KEYS as Keys, 'rotCW', 'Space', 'add');
    expect(steal.ok).toBe(false);
    expect(steal.keys).toEqual(DEFAULT_KEYS);
  });
  it('every action keeps at least one and at most four keys after any random rebind sequence', () => {
    let a = 20260211;
    const r = (): number => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
    const pool = ['Space', 'KeyM', 'KeyZ', 'KeyA', 'KeyC', 'ArrowUp', 'KeyQ', 'KeyE', 'KeyP', 'Escape', 'KeyD', 'ShiftLeft', 'Tab'];
    let keys = DEFAULT_KEYS as Keys;
    for (let i = 0; i < 2000; i++) {
      const action = ACTIONS[Math.floor(r() * ACTIONS.length)] as (typeof ACTIONS)[number];
      const code = pool[Math.floor(r() * pool.length)] as string;
      keys = rebindKey(keys, action, code, r() < 0.3 ? 'add' : 'replace').keys;
      for (const act of ACTIONS) {
        expect(keys[act].length).toBeGreaterThanOrEqual(1);
        expect(keys[act].length).toBeLessThanOrEqual(MAX_KEYS_PER_ACTION);
      }
    }
  });
});
