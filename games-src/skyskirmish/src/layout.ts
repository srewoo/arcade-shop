// Pure layout maths: where the 360x640 gameplay lane sits inside the full-bleed canvas, and how
// the HUD is arranged around it. DOM-free so it can be unit tested.
import { WORLD } from './config';

export type LayoutMode = 'side' | 'stack';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Layout {
  mode: LayoutMode;
  /** CSS px per world unit. */
  scale: number;
  /** Lane rectangle in CSS px, relative to the canvas. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Width in px of the free zone on each side of the lane (side mode). */
  zone: number;
}

/** Minimum free width on each side of the lane before the HUD moves into side zones. */
export const SIDE_MIN = 150;
/** Stack mode reserves a top strip for the HUD and a bottom dock for bomb, power-ups and hints. */
export const STACK_TOP = 58;
export const STACK_BOTTOM = 64;
export const MAX_ZONE = 260;

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

export function computeLayout(vw: number, vh: number, insets: Insets = NO_INSETS): Layout {
  const availW = Math.max(1, vw - insets.left - insets.right);
  const availH = Math.max(1, vh - insets.top - insets.bottom);
  const sideScale = availH / WORLD.h;
  if (availW - WORLD.w * sideScale >= SIDE_MIN * 2) {
    const w = WORLD.w * sideScale;
    const x = insets.left + (availW - w) / 2;
    return { mode: 'side', scale: sideScale, x, y: insets.top, w, h: availH, zone: Math.min(MAX_ZONE, x - insets.left - 28) };
  }
  const innerH = Math.max(1, availH - STACK_TOP - STACK_BOTTOM);
  const scale = Math.max(0.1, Math.min(availW / WORLD.w, innerH / WORLD.h));
  const w = WORLD.w * scale;
  const h = WORLD.h * scale;
  return {
    mode: 'stack',
    scale,
    x: insets.left + (availW - w) / 2,
    y: insets.top + STACK_TOP + (innerH - h) / 2,
    w,
    h,
    zone: 0,
  };
}

/** Share of the viewport covered by the live canvas (it is full-bleed) and by the lane itself. */
export function coverage(l: Layout, vw: number, vh: number): { canvas: number; lane: number } {
  return { canvas: 1, lane: (l.w * l.h) / Math.max(1, vw * vh) };
}

/** Client pointer position to world units. `canvasLeft/Top` is the canvas bounding box origin. */
export function toWorld(clientX: number, clientY: number, canvasLeft: number, canvasTop: number, l: Pick<Layout, 'x' | 'y' | 'scale'>): { x: number; y: number } {
  return { x: (clientX - canvasLeft - l.x) / l.scale, y: (clientY - canvasTop - l.y) / l.scale };
}
