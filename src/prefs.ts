import { z } from 'zod';

// Launcher preferences (favourites + recently played) in localStorage. The extension origin is shared
// with the games, so the key is namespaced; every game uses its own prefix too.
export const PREFS_KEY = 'arcadeshop-launcher';
export const MAX_RECENT = 6;

const PrefsSchema = z.object({
  favourites: z.array(z.string().max(24)).max(50),
  recent: z.array(z.string().max(24)).max(MAX_RECENT),
});

export type Prefs = Readonly<{ favourites: readonly string[]; recent: readonly string[] }>;
export const EMPTY_PREFS: Prefs = { favourites: [], recent: [] };

/** Validates stored data; garbage gives empty prefs, unknown game ids and duplicates are dropped. */
export function parsePrefs(input: unknown, knownIds: ReadonlySet<string>): Prefs {
  const r = PrefsSchema.safeParse(input);
  if (!r.success) return EMPTY_PREFS;
  const clean = (ids: readonly string[]): string[] => [...new Set(ids)].filter((id) => knownIds.has(id));
  return { favourites: clean(r.data.favourites), recent: clean(r.data.recent) };
}

export function loadPrefs(store: Pick<Storage, 'getItem'>, knownIds: ReadonlySet<string>): Prefs {
  try {
    const text = store.getItem(PREFS_KEY);
    return text ? parsePrefs(JSON.parse(text), knownIds) : EMPTY_PREFS;
  } catch {
    return EMPTY_PREFS;
  }
}

/** Returns false when storage is unavailable (private mode, quota); the launcher keeps working in memory. */
export function savePrefs(store: Pick<Storage, 'setItem'>, prefs: Prefs): boolean {
  try {
    store.setItem(PREFS_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export const markPlayed = (prefs: Prefs, id: string): Prefs => ({
  ...prefs,
  recent: [id, ...prefs.recent.filter((r) => r !== id)].slice(0, MAX_RECENT),
});

export const toggleFavourite = (prefs: Prefs, id: string): Prefs => ({
  ...prefs,
  favourites: prefs.favourites.includes(id) ? prefs.favourites.filter((f) => f !== id) : [...prefs.favourites, id],
});
