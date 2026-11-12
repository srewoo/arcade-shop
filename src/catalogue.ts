import { z } from 'zod';
import raw from './games.json';

export const GENRES = ['action', 'driving', 'sports', 'puzzle'] as const;
export type Genre = (typeof GENRES)[number];

export const GENRE_LABELS: Readonly<Record<Genre, string>> = {
  action: 'Action',
  driving: 'Driving',
  sports: 'Sports',
  puzzle: 'Puzzle',
};

const GameSchema = z
  .object({
    id: z.string().regex(/^[a-z]{2,24}$/),
    dir: z.string().regex(/^[a-z]+(\/src)?$/),
    title: z.string().min(1).max(40),
    genre: z.enum(GENRES),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    pitch: z.string().min(1).max(90),
  })
  .strict();

export type Game = Readonly<z.infer<typeof GameSchema>>;

/** Validates the catalogue: rejects bad entries and duplicate ids loudly (it ships with the build). */
export function parseCatalogue(input: unknown): readonly Game[] {
  const games = z.array(GameSchema).min(1).parse(input);
  const seen = new Set<string>();
  for (const g of games) {
    if (seen.has(g.id)) throw new Error(`Duplicate game id: ${g.id}`);
    seen.add(g.id);
  }
  return Object.freeze(games.map((g) => Object.freeze(g)));
}

export const GAMES: readonly Game[] = parseCatalogue(raw);

export const gamePath = (id: string): string => `games/${id}/index.html`;
export const thumbPath = (id: string): string => `thumbs/${id}.webp`;
export const findGame = (id: string): Game | undefined => GAMES.find((g) => g.id === id);
