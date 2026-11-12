// Node-side view of src/games.json for the build scripts (the launcher validates it with zod at runtime and in tests).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const EXT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const GAMES_SRC = resolve(EXT_ROOT, 'games-src');
export const DIST = resolve(EXT_ROOT, 'dist');

/** @returns {{id: string, dir: string, title: string}[]} */
export function loadGames() {
  const games = JSON.parse(readFileSync(resolve(EXT_ROOT, 'src', 'games.json'), 'utf8'));
  for (const g of games) {
    if (!/^[a-z]{2,24}$/.test(g.id) || !/^[a-z]+(\/src)?$/.test(g.dir)) throw new Error(`Bad catalogue entry: ${JSON.stringify(g)}`);
  }
  return games;
}
