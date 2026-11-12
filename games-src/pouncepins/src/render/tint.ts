// Tiny colour helpers with memoisation, so sprite shading never parses colours per frame.
const cache = new Map<string, string>();

/** Mix a #rrggbb colour towards white (t>0) or black (t<0). */
export function mix(hex: string, t: number): string {
  const key = `${hex}|${t}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = parseInt(hex.slice(1), 16);
  const target = t >= 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number): number => Math.round(v + (target - v) * k);
  const out = `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
  cache.set(key, out);
  return out;
}
