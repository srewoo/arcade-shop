// Fixed y-bands of the scenery (logical units). Shared by the static layers and the animated crowd.
export const BANDS = {
  stands: { top: 236, bottom: 398 },
  rows: [286, 322, 358] as const,
  wall: { top: 398, bottom: 446 },
  vanishY: 300,
  courtFar: 446,
  serviceY: 585,
} as const;

/** Court line x at world y for lateral fraction f (-1..1), converging on the vanishing point. */
export function laneX(cx: number, worldW: number, f: number, y: number): number {
  return cx + f * worldW * 0.00248 * (y - BANDS.vanishY);
}

export interface Layer { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D; x0: number; y0: number }

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}
