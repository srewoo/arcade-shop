import { CONFIG } from '../config';

export interface View {
  w: number; h: number; dpr: number; scale: number; rot: boolean;
  /** CSS-pixel matrix mapping world -> screen: x' = a x + c y + e, y' = b x + d y + f. */
  a: number; b: number; c: number; d: number; e: number; f: number;
}

/** The part of the 800x500 world every hole sits in; it is fitted into the free screen area. */
const BOUNDS = { w: 700, h: 410, cx: 400, cy: 250 };

export function computeView(w: number, h: number, dpr: number): View {
  const rot = h > w * 1.15;
  const topPad = rot ? 112 : 64;
  const botPad = rot ? 196 : 84;
  const availW = Math.max(50, w - 24);
  const availH = Math.max(50, h - topPad - botPad);
  const bw = rot ? BOUNDS.h : BOUNDS.w;
  const bh = rot ? BOUNDS.w : BOUNDS.h;
  const scale = Math.max(0.1, Math.min(availW / bw, availH / bh));
  const sx = w / 2;
  const sy = topPad + availH / 2;
  const d = Math.min(2, Math.max(1, dpr));
  if (rot) return { w, h, dpr: d, scale, rot, a: 0, b: scale, c: -scale, d: 0, e: sx + scale * BOUNDS.cy, f: sy - scale * BOUNDS.cx };
  return { w, h, dpr: d, scale, rot, a: scale, b: 0, c: 0, d: scale, e: sx - scale * BOUNDS.cx, f: sy - scale * BOUNDS.cy };
}

export function toWorld(v: View, sx: number, sy: number): { x: number; y: number } {
  return v.rot ? { x: (sy - v.f) / v.scale, y: (v.e - sx) / v.scale } : { x: (sx - v.e) / v.scale, y: (sy - v.f) / v.scale };
}

/** Screen-space drag vector -> world-orientation vector (no translation, no scale). */
export function vecToWorld(v: View, dx: number, dy: number): { x: number; y: number } {
  return v.rot ? { x: dy, y: -dx } : { x: dx, y: dy };
}

export const worldToScreen = (v: View, x: number, y: number): { x: number; y: number } =>
  ({ x: v.a * x + v.c * y + v.e, y: v.b * x + v.d * y + v.f });

export const WORLD = CONFIG.world;
