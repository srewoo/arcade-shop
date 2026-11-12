// Quick puzzles: a seed deterministically yields a level whose optimal path
// length (found by the BFS solver) sits inside the chosen tier's par window.
import { CONFIG, type QuickTier } from './config';
import { validateShape, type Goal, type LevelDef } from './jugs';
import { createRng, type Rng } from './rng';
import { solve } from './solver';

interface Candidate {
  readonly jugs: number[];
  readonly start: number[];
  readonly goal: Goal;
}

export const tierById = (id: string): QuickTier =>
  CONFIG.quick.tiers.find((t) => t.id === id) ?? (CONFIG.quick.tiers[0] as QuickTier);

function randomCaps(rng: Rng, tier: QuickTier): number[] {
  const n = rng.int(tier.jugs[0], tier.jugs[1]);
  const caps = new Set<number>();
  for (let guard = 0; caps.size < n && guard < 200; guard++) caps.add(rng.int(2, tier.capMax));
  return [...caps].sort((a, b) => a - b);
}

function candidate(rng: Rng, tier: QuickTier): Candidate | null {
  const jugs = randomCaps(rng, tier);
  const top = jugs.length - 1;
  const biggest = jugs[top] as number;
  const zeros = jugs.map(() => 0);
  if (tier.split && rng.next() < 0.5) {
    const total = 2 * rng.int(1, Math.floor(biggest / 2));
    const start = [...zeros];
    start[top] = total;
    return { jugs, start, goal: { amount: total / 2, count: 2 } };
  }
  const amount = rng.int(1, biggest - 1);
  return jugs.includes(amount) ? null : { jugs, start: zeros, goal: { amount, count: 1 } };
}

const fallback = (seed: number): LevelDef => ({
  id: 0,
  name: `Puzzle ${seed}`,
  jugs: [3, 5],
  start: [0, 0],
  goal: { amount: 4, count: 1 },
  par: 6,
});

/** Same seed and tier always return the same level. */
export function generateQuick(seed: number, tierId: string): LevelDef {
  const tier = tierById(tierId);
  const rng = createRng(seed * 31 + tier.parMin);
  for (let i = 0; i < CONFIG.quick.attempts; i++) {
    const c = candidate(rng, tier);
    if (!c || validateShape(c.jugs, c.start, c.goal)) continue;
    const par = solve(c.jugs, c.start, c.goal)?.length ?? 0;
    if (par >= tier.parMin && par <= tier.parMax) return { id: 0, name: `Puzzle ${seed}`, ...c, par };
  }
  return fallback(seed);
}

export const randomSeed = (): number => 1 + Math.floor(Math.random() * CONFIG.quick.seedMax);
