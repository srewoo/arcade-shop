// Responsive view: the canvas fills its stage; the logical view grows sideways (scenery)
// and the road stays centred. Pure maths in computeLayout, one mutable `view` shared by renderers.
import { CONFIG } from './config';

export interface View {
  width: number; height: number; roadLeft: number; laneW: number; playerY: number; pxPerU: number; scale: number;
}

export const ROAD_W = CONFIG.view.laneW * CONFIG.lanes;
const SIDE_PAD = 20;
export const LANDSCAPE_RATIO = 1.3;

/** Logical height we aim for, and the empty road kept behind the player (room for touch pads and hint). */
const LANDSCAPE = { height: 500, behind: 90 };
const PORTRAIT = { height: 600, behind: 150 };

export function computeLayout(w: number, h: number): View {
  const mode = w / h >= LANDSCAPE_RATIO ? LANDSCAPE : PORTRAIT;
  const scale = Math.min(w / (ROAD_W + SIDE_PAD * 2), h / mode.height);
  const width = w / scale;
  const height = h / scale;
  return {
    width, height, scale, laneW: CONFIG.view.laneW, pxPerU: CONFIG.view.pxPerU,
    roadLeft: (width - ROAD_W) / 2, playerY: height - mode.behind,
  };
}

export const view: View = { ...CONFIG.view, scale: 1 };

export function applyLayout(w: number, h: number): void {
  if (w > 0 && h > 0) Object.assign(view, computeLayout(w, h));
}

/** Share of the viewport the road canvas covers (1 when it fills the stage). */
export const roadShare = (v: View, w: number, h: number): number => (ROAD_W * v.scale * h) / (w * h);
