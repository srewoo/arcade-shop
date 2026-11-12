// Projection: lane space (x along the lane, y across, z up) to canvas pixels.
// Landscape canvases lay the lane left-to-right, portrait ones bottom-to-top,
// both with a 3/4 look: far end higher, cats drawn as upright sprites (so the
// view reads as side-on rather than top-down). In portrait the pin deck is
// stretched so the rack stays readable on a narrow screen.
import { CONFIG } from '../config';

const { lane } = CONFIG;
const X_MIN = -80;
const X_MAX = lane.endX + 20;
const CAT_H = 74;
const PAD = 14;

export interface Camera {
  readonly w: number;
  readonly h: number;
  readonly portrait: boolean;
  /** Sprite scale (pixels per sprite unit). */
  readonly k: number;
  project(x: number, y: number, z?: number): { x: number; y: number };
}

/**
 * Run-up compressed, pin deck stretched (smooth blend) so the rack stays readable.
 * Returns a lookup of the integrated scale, sampled every STEP lane units.
 */
function makeStretch(pre: number, deck: number): (x: number) => number {
  const STEP = 5;
  const table: number[] = [0];
  for (let x = X_MIN; x < X_MAX + STEP; x += STEP) {
    const t = Math.min(1, Math.max(0, (x - 650) / 500));
    const s = t * t * (3 - 2 * t);
    table.push((table.at(-1) ?? 0) + (pre + (deck - pre) * s) * STEP);
  }
  return (x) => {
    const f = (Math.min(X_MAX, Math.max(X_MIN, x)) - X_MIN) / STEP;
    const i = Math.floor(f);
    const a = table[i] ?? 0, b = table[i + 1] ?? a;
    return a + (b - a) * (f - i);
  };
}

function landscape(w: number, h: number): Camera {
  const stretch = makeStretch(0.7, 1.5);
  const lift = h / w < 0.4 ? 0.04 : 0.07;
  const along = (w - 2 * PAD) / stretch(X_MAX);
  const room = h - 2 * PAD - (w - 2 * PAD) * lift;
  const across = (room - 4) / (2 * lane.gutterHalf + CAT_H * 1.5);
  const k = Math.max(0.2, Math.min(across * 1.5, 1.3));
  const base = h - PAD - lane.gutterHalf * across;
  return {
    w, h, portrait: false, k,
    project: (x, y, z = 0) => ({
      x: PAD + stretch(x) * along,
      y: base - stretch(x) * along * lift + y * across - z * k,
    }),
  };
}

function portraitCam(w: number, h: number): Camera {
  const stretch = makeStretch(0.55, 2.1);
  const along = (h - 2 * PAD) / stretch(X_MAX);
  const across = (w - 2 * PAD) / (2 * lane.gutterHalf + 40);
  const k = Math.min(across * 1.05, 1.15);
  return {
    w, h, portrait: true, k,
    project: (x, y, z = 0) => ({ x: w / 2 + y * across, y: h - PAD - stretch(x) * along - z * k }),
  };
}

export function makeCamera(w: number, h: number): Camera {
  return h > w * 0.95 ? portraitCam(w, h) : landscape(w, h);
}
