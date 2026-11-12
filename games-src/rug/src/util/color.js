import { clamp } from "./math.js";

/** "#rrggbb" -> [r, g, b] (0..255). */
export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Lighten (amount > 0, towards white) or darken (amount < 0, towards black) a hex colour; returns a CSS rgb() string. */
export function shadeColor(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (c) => clamp(Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)), 0, 255);
  return `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
}
