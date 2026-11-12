import { describe, expect, it, vi } from 'vitest';
import { GAMES } from '../src/catalogue';
import { filterGames, matchesQuery } from '../src/filter';
import { openArcade, openGame } from '../src/launch';

const ids = (list: { id: string }[]): string[] => list.map((g) => g.id);

describe('filterGames', () => {
  it('all shelf with no query returns everything in catalogue order', () => {
    expect(ids(filterGames(GAMES, { query: '', shelf: 'all', favourites: [] }))).toEqual(ids([...GAMES]));
  });

  it('genre shelves only show that genre', () => {
    const driving = filterGames(GAMES, { query: '', shelf: 'driving', favourites: [] });
    expect(ids(driving).sort()).toEqual(['kerbside', 'redlinerush', 'rug']);
  });

  it('favourites shelf shows only favourites', () => {
    expect(ids(filterGames(GAMES, { query: '', shelf: 'favourites', favourites: ['rug', 'dino'] }))).toEqual(['dino', 'rug']);
  });

  it('search matches title, genre and pitch words, case and punctuation insensitive', () => {
    expect(ids(filterGames(GAMES, { query: 'TIC tac', shelf: 'all', favourites: [] }))).toEqual(['tictactoe']);
    expect(ids(filterGames(GAMES, { query: 'bowling', shelf: 'all', favourites: [] })).sort()).toEqual(['luckylanes', 'pouncepins']);
    expect(filterGames(GAMES, { query: 'zzzz', shelf: 'all', favourites: [] })).toEqual([]);
  });

  it('blank or symbol-only queries match everything', () => {
    const g = GAMES[0]!;
    expect(matchesQuery(g, '   ')).toBe(true);
    expect(matchesQuery(g, '!!')).toBe(true);
  });
});

describe('launching', () => {
  it('opens the bundled game in a new tab through chrome.tabs', async () => {
    const create = vi.fn(async () => ({}));
    const open = vi.fn();
    await openGame('rug', { chrome: { tabs: { create }, runtime: { getURL: (p) => `chrome-extension://abc/${p}` } }, open });
    expect(create).toHaveBeenCalledWith({ url: 'chrome-extension://abc/games/rug/index.html', active: true });
    expect(open).not.toHaveBeenCalled();
  });

  it('falls back to window.open outside the extension (e.g. dev server)', async () => {
    const open = vi.fn();
    await openGame('dino', { chrome: undefined, open });
    expect(open).toHaveBeenCalledWith('games/dino/index.html');
    await openArcade({ chrome: {}, open });
    expect(open).toHaveBeenCalledWith('arcade.html');
  });
});
