// Small seeded PRNG (mulberry32). The simulation draws every random number from one of these,
// so a seed plus an input script reproduces a run exactly.
export interface Rng {
  /** Current internal state; saving and restoring it resumes the sequence. */
  state: number;
  next(): number;
  int(maxExclusive: number): number;
  range(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRng(seed: number): Rng {
  const rng: Rng = {
    state: seed >>> 0,
    next() {
      rng.state = (rng.state + 0x6d2b79f5) >>> 0;
      let t = rng.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int: (n) => Math.floor(rng.next() * n),
    range: (a, b) => a + (b - a) * rng.next(),
    pick: (items) => items[Math.floor(rng.next() * items.length)] as never,
  };
  return rng;
}
