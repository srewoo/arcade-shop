import { describe, expect, it } from 'vitest';
import { EMPTY_PREFS, MAX_RECENT, PREFS_KEY, loadPrefs, markPlayed, parsePrefs, savePrefs, toggleFavourite } from '../src/prefs';

const known = new Set(['dino', 'rug', 'tictactoe', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);

const memory = (): Storage => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0 };
};

describe('parsePrefs', () => {
  it('falls back to empty prefs on garbage', () => {
    for (const bad of [null, 'x', 42, [], { favourites: 'dino' }, { favourites: [], recent: [1] }]) {
      expect(parsePrefs(bad, known)).toEqual(EMPTY_PREFS);
    }
  });

  it('drops unknown game ids and duplicates', () => {
    expect(parsePrefs({ favourites: ['dino', 'ghost', 'dino'], recent: ['rug', 'nope'] }, known)).toEqual({
      favourites: ['dino'],
      recent: ['rug'],
    });
  });

  it('rejects oversized lists', () => {
    expect(parsePrefs({ favourites: [], recent: Array(MAX_RECENT + 1).fill('dino') }, known)).toEqual(EMPTY_PREFS);
  });
});

describe('load/save', () => {
  it('round-trips through storage', () => {
    const store = memory();
    const prefs = { favourites: ['rug'], recent: ['dino'] };
    expect(savePrefs(store, prefs)).toBe(true);
    expect(loadPrefs(store, known)).toEqual(prefs);
  });

  it('survives corrupt JSON and throwing storage', () => {
    const store = memory();
    store.setItem(PREFS_KEY, '{not json');
    expect(loadPrefs(store, known)).toEqual(EMPTY_PREFS);
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadPrefs(broken, known)).toEqual(EMPTY_PREFS);
    expect(savePrefs(broken, EMPTY_PREFS)).toBe(false);
  });

  it('uses a namespaced key that no game uses', () => {
    expect(PREFS_KEY).toBe('arcadeshop-launcher');
  });
});

describe('updates', () => {
  it('markPlayed moves the game to the front, dedupes and caps the list', () => {
    let p = EMPTY_PREFS;
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) p = markPlayed(p, id);
    expect(p.recent).toEqual(['g', 'f', 'e', 'd', 'c', 'b']);
    p = markPlayed(p, 'd');
    expect(p.recent).toEqual(['d', 'g', 'f', 'e', 'c', 'b']);
  });

  it('toggleFavourite adds then removes without mutating the input', () => {
    const on = toggleFavourite(EMPTY_PREFS, 'rug');
    expect(on.favourites).toEqual(['rug']);
    expect(toggleFavourite(on, 'rug').favourites).toEqual([]);
    expect(EMPTY_PREFS.favourites).toEqual([]);
  });
});
