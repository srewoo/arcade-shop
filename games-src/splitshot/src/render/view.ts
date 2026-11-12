// Maps the 640x400 logical world onto the canvas. Uniform scale; spare space above/below (portrait)
// or beside (wide) the playfield is filled by the backdrop art, never by stretching.
import { CONFIG } from '../config';

export interface View {
  readonly pxW: number;
  readonly pxH: number;
  readonly dpr: number;
  /** CSS pixels per world unit. */
  readonly s: number;
  /** CSS px offset of the world origin. */
  readonly ox: number;
  readonly oy: number;
  /** Visible world rectangle (extends past the playfield when space is spare). */
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

export function computeView(pxW: number, pxH: number, rawDpr: number, reserveTop = 0, reserveBottom = 0): View {
  const dpr = Math.min(2, Math.max(1, rawDpr));
  const { w, h } = CONFIG.world;
  const availH = Math.max(80, pxH - reserveTop - reserveBottom);
  const s = Math.max(0.1, Math.min(pxW / w, availH / h));
  const ox = (pxW - w * s) / 2;
  const oy = reserveTop + (availH - h * s) * 0.6;
  return { pxW, pxH, dpr, s, ox, oy, x0: -ox / s, x1: (pxW - ox) / s, y0: -oy / s, y1: (pxH - oy) / s };
}

export const viewKey = (v: View): string => `${v.pxW}x${v.pxH}@${v.dpr}:${v.s.toFixed(3)}:${v.oy.toFixed(1)}`;

/** Set the context transform so drawing happens in world units. */
export function applyWorld(ctx: CanvasRenderingContext2D, v: View, shakeX = 0, shakeY = 0): void {
  const k = v.dpr * v.s;
  ctx.setTransform(k, 0, 0, k, (v.ox + shakeX) * v.dpr, (v.oy + shakeY) * v.dpr);
}
