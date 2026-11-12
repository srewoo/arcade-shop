// Fits the whole lot into the canvas. Wide lots turn 90 degrees on portrait screens.
import { CONFIG } from '../config';

export interface View {
  readonly rotated: boolean;
  readonly scale: number;
  readonly tx: number;
  readonly ty: number;
}

/** `top` reserves CSS px at the top of the canvas (the in-scene HUD) so the lot never hides under it. */
export function fitView(cw: number, ch: number, ww: number, wh: number, top = 0): View {
  const m = CONFIG.camera.margin * 2;
  const avail = Math.max(1, ch - top);
  const rotated = avail > cw * 1.05 && ww > wh * 1.05;
  const bw = rotated ? wh : ww;
  const bh = rotated ? ww : wh;
  const scale = Math.max(1, Math.min(cw / (bw + m), avail / (bh + m)));
  return { rotated, scale, tx: (cw - bw * scale) / 2, ty: top + (avail - bh * scale) / 2 };
}

/** Apply the view to a 2D context (after the device pixel ratio has been set). */
export function applyView(ctx: CanvasRenderingContext2D, v: View, dpr: number, wh: number, shake: { x: number; y: number }): void {
  if (v.rotated) ctx.setTransform(0, v.scale * dpr, -v.scale * dpr, 0, (v.tx + wh * v.scale + shake.x) * dpr, (v.ty + shake.y) * dpr);
  else ctx.setTransform(v.scale * dpr, 0, 0, v.scale * dpr, (v.tx + shake.x) * dpr, (v.ty + shake.y) * dpr);
}
