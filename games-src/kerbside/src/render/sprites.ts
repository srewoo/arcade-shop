// Offscreen sprite cache. Art is drawn once in metres at PPM pixels per metre, then blitted.
export const PPM = 90;
const cache = new Map<string, HTMLCanvasElement>();

/** Bake a sprite covering [-hw-pad, hw+pad] x [-hh-pad, hh+pad] metres, centred on the origin. */
export function bake(key: string, hw: number, hh: number, pad: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = Math.ceil((hw + pad) * 2 * PPM);
  c.height = Math.ceil((hh + pad) * 2 * PPM);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.scale(PPM, PPM);
  g.translate(hw + pad, hh + pad);
  paint(g);
  cache.set(key, c);
  return c;
}

export function blit(g: CanvasRenderingContext2D, c: HTMLCanvasElement, hw: number, hh: number, pad: number): void {
  g.drawImage(c, -hw - pad, -hh - pad, (hw + pad) * 2, (hh + pad) * 2);
}
