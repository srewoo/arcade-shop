// Memo for canvas gradients: building one per frame per pin was the main allocation in the render loop.
// Keys encode every input, and the table is bounded so a long resize drag cannot grow it.

const MAX_ENTRIES = 96;
const cache = new Map<string, CanvasGradient>();

export function memoGradient(key: string, make: () => CanvasGradient): CanvasGradient {
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size >= MAX_ENTRIES) cache.clear();
  const g = make();
  cache.set(key, g);
  return g;
}

/** Quantise a px-per-cm scale so near-identical pin sizes share one gradient. */
export const quantiseScale = (s: number): number => Math.max(0.05, Math.round(s * 50) / 50);

export const gradientCacheSize = (): number => cache.size;
