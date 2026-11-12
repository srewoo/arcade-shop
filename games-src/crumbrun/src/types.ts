// Shared primitives for the pure simulation layer (no DOM, no canvas).
export type Dir = 'U' | 'D' | 'L' | 'R' | 'N';
export type MoveDir = Exclude<Dir, 'N'>;

/** Tie-break order used by every steering routine. */
export const MOVES: readonly MoveDir[] = ['U', 'L', 'D', 'R'];

export const VEC: Readonly<Record<Dir, { readonly dx: number; readonly dy: number }>> = {
  U: { dx: 0, dy: -1 },
  D: { dx: 0, dy: 1 },
  L: { dx: -1, dy: 0 },
  R: { dx: 1, dy: 0 },
  N: { dx: 0, dy: 0 },
};

export function opposite(d: Dir): Dir {
  if (d === 'U') return 'D';
  if (d === 'D') return 'U';
  if (d === 'L') return 'R';
  if (d === 'R') return 'L';
  return 'N';
}

export interface Tile {
  readonly col: number;
  readonly row: number;
}

/** Who is asking: Pip and active cats may not enter the basket; 'home' may. */
export type Access = 'pip' | 'cat' | 'home';

export const FIXED_DT = 1 / 60;

export type CatKind = 'smudge' | 'biscuit' | 'tuxedo' | 'ginger';
export const CAT_KINDS: readonly CatKind[] = ['smudge', 'biscuit', 'tuxedo', 'ginger'];

export type Rng = () => number;

/** Small deterministic PRNG so simulations are reproducible in tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
