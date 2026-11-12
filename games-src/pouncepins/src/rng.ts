// Seeded randomness: the same seed always produces the same game.
export type Rng = () => number;

/** mulberry32: small, fast, well distributed for gameplay use. */
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

/** FNV-1a over integer parts: derive independent streams from one seed. */
export function hashSeed(...parts: readonly number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    let v = Math.trunc(p) >>> 0;
    for (let i = 0; i < 4; i++) {
      h ^= v & 255;
      h = Math.imul(h, 0x01000193);
      v >>>= 8;
    }
  }
  return h >>> 0;
}

export const between = (rng: Rng, lo: number, hi: number): number => lo + (hi - lo) * rng();
export const intBetween = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));

/** Fisher-Yates on a copy. */
export function shuffled<T>(rng: Rng, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
