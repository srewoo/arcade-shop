import type { Game, Genre } from './catalogue';

export type Shelf = 'all' | 'favourites' | Genre;

export interface FilterInput {
  readonly query: string;
  readonly shelf: Shelf;
  readonly favourites: readonly string[];
}

const normalise = (s: string): string => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, '');

/** Every word of the query must appear in the title, genre or pitch. */
export function matchesQuery(game: Game, query: string): boolean {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = normalise(`${game.title} ${game.genre} ${game.pitch}`);
  return words.every((w) => hay.includes(w));
}

export function filterGames(games: readonly Game[], f: FilterInput): Game[] {
  return games.filter((g) => {
    if (f.shelf === 'favourites' && !f.favourites.includes(g.id)) return false;
    if (f.shelf !== 'all' && f.shelf !== 'favourites' && g.genre !== f.shelf) return false;
    return matchesQuery(g, f.query);
  });
}
