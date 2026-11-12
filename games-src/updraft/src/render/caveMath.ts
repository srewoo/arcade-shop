// Shared scenery maths for the cave backdrop (ridge profiles and a cosmetic hash).
export const LAYERS = [
  { k: 0.18, base: 130, amp: 46, alpha: 0.5, tone: 'far' },
  { k: 0.32, base: 230, amp: 40, alpha: 0.7, tone: 'mid' },
  { k: 0.5, base: 330, amp: 34, alpha: 0.9, tone: 'mid' },
] as const;

/** Deterministic 0..1 hash of two integers (cosmetic scatter only). */
export function hash2(a: number, b: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Ridge height of layer `i` at parallax-space coordinate `u` (= world x * k). */
export function ridgeY(i: number, u: number): number {
  const L = LAYERS[i] as (typeof LAYERS)[number];
  return L.base + Math.sin(u * 0.021 + i * 2.1) * L.amp + Math.sin(u * 0.053 + i) * (L.amp * 0.4);
}


/** `#rrggbb` + alpha -> rgba() string (falls back to a cool grey for non-hex input). */
export function hexA(col: string, a: number): string {
  const h = /^#([0-9a-f]{6})$/i.exec(col.trim());
  if (!h) return `rgba(120,160,190,${a})`;
  const n = parseInt(h[1] as string, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
