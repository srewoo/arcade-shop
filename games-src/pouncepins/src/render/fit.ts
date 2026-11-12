// Text fitting helper (pure) so canvas labels never overflow their card.

/** Largest font size <= `px` (but >= `minPx`) so text measured at `px` fits in `maxWidth`. */
export function fitFontPx(widthAtPx: number, px: number, maxWidth: number, minPx = 6): number {
  if (widthAtPx <= 0 || widthAtPx <= maxWidth) return px;
  return Math.max(minPx, Math.floor(((px * maxWidth) / widthAtPx) * 10) / 10);
}
