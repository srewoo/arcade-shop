// Pure planning for the campaign list: group visible levels by jug count and
// tease the rest instead of showing a wall of locked tiles.
export interface Group<T> {
  readonly jugs: number;
  readonly items: readonly T[];
}
export interface LevelPlan<T> {
  readonly groups: readonly Group<T>[];
  readonly hidden: number;
}

/** Levels up to `open + peek` are listed; later ones are only counted. */
export function planLevels<T extends { id: number; jugs: readonly unknown[] }>(levels: readonly T[], open: number, peek: number): LevelPlan<T> {
  const limit = open + peek;
  const shown = levels.filter((l) => l.id <= limit);
  const groups: { jugs: number; items: T[] }[] = [];
  for (const l of shown) {
    const last = groups.at(-1);
    if (last && last.jugs === l.jugs.length) last.items.push(l);
    else groups.push({ jugs: l.jugs.length, items: [l] });
  }
  return { groups, hidden: levels.length - shown.length };
}
