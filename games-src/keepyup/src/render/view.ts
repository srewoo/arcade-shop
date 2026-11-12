// Maps logical world units (600 tall) onto the canvas. Uniform scale. The playfield is as wide
// as the screen allows (360..960 logical px); extra width becomes hedge, extra height becomes
// sky above and court below, so the playfield is never stretched.
import { CONFIG } from '../config';

export interface View {
  readonly pxW: number;
  readonly pxH: number;
  readonly dpr: number;
  /** CSS px per logical unit. */
  readonly s: number;
  /** Logical width of the whole canvas, and of the playfield inside it. */
  readonly wv: number;
  readonly worldW: number;
  /** Logical x of the playfield's left wall on the canvas. */
  readonly ox: number;
  /** Logical y at the canvas top and bottom (top is negative when letterboxed). */
  readonly top: number;
  readonly bottom: number;
}

export function computeView(pxW: number, pxH: number, rawDpr: number): View {
  const dpr = Math.min(2, Math.max(1, rawDpr));
  const w = CONFIG.world;
  const s = Math.max(0.1, Math.min(pxH / w.height, pxW / w.minWidth));
  const wv = pxW / s;
  const worldW = Math.min(wv, w.maxWidth);
  const extra = pxH / s - w.height;
  // Keep slightly more sky than court: the ground plane sits in the lower part of the canvas.
  const top = -extra * 0.55;
  return { pxW, pxH, dpr, s, wv, worldW, ox: (wv - worldW) / 2, top, bottom: top + pxH / s };
}

export interface WorldPoint { x: number; y: number }

/** Canvas-relative CSS pixels to world coordinates. */
export function toWorld(v: View, px: number, py: number): WorldPoint {
  return { x: px / v.s - v.ox, y: py / v.s + v.top };
}

/** Set the 2D transform so drawing happens in world coordinates. */
export function applyWorld(ctx: CanvasRenderingContext2D, v: View, shakeX = 0, shakeY = 0): void {
  const k = v.s * v.dpr;
  ctx.setTransform(k, 0, 0, k, (v.ox * v.s + shakeX) * v.dpr, (-v.top * v.s + shakeY) * v.dpr);
}
