// The static table is painted once per size into an offscreen canvas and blitted every frame.
import { drawTable } from './renderTable';
import type { View } from './view';

let layer: HTMLCanvasElement | null = null;
let layerKey = '';

const keyOf = (view: View, dpr: number, w: number, h: number): string => `${w}|${h}|${dpr}|${view.m.join(',')}`;

/** Draw the cached table with a screen-space offset (screen shake). */
export function drawTableLayer(ctx: CanvasRenderingContext2D, view: View, dpr: number, cssW: number, cssH: number, jx: number, jy: number): void {
  const key = keyOf(view, dpr, cssW, cssH);
  if (!layer || layerKey !== key) {
    layer = layer ?? document.createElement('canvas');
    layer.width = Math.round(cssW * dpr); layer.height = Math.round(cssH * dpr);
    const lc = layer.getContext('2d');
    if (!lc) { fallback(ctx, view, dpr, jx, jy); return; }
    const [a, b, c, d, e, f] = view.m;
    lc.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * e, dpr * f);
    drawTable(lc);
    layerKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, Math.round(jx * dpr), Math.round(jy * dpr));
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function fallback(ctx: CanvasRenderingContext2D, view: View, dpr: number, jx: number, jy: number): void {
  const [a, b, c, d, e, f] = view.m;
  ctx.setTransform(dpr * a, dpr * b, dpr * c, dpr * d, dpr * (e + jx), dpr * (f + jy));
  drawTable(ctx);
}
