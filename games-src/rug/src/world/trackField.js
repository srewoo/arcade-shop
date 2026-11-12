// Per-pixel track-progress field + colour lookup derived from the painted print.
import { RUG } from "./layoutSelect.js";
import { TRACK } from "./trackSamples.js";
import { createCanvas } from "./paint/canvasUtils.js";

/**
 * Float field (w*h) holding normalised arclength s/length for every cell within 10.5 units of
 * the centreline (nearest sample wins), -1 elsewhere. Uploaded as a half-float texture (uTrackS)
 * so the shader can reveal the route layer progressively along the lap.
 * @param {number} perUnit cells per world unit
 */
export function buildTrackField(perUnit = 2) {
  const w = RUG.W * perUnit;
  const h = RUG.H * perUnit;
  const data = new Float32Array(w * h).fill(-1);
  const radiusUnits = 10.5;
  const best = new Float32Array(w * h).fill(1e9);
  for (let k = 0; k < TRACK.n; k++) {
    const cx = (TRACK.x[k] + RUG.W / 2) * perUnit;
    const cy = (TRACK.y[k] + RUG.H / 2) * perUnit;
    const r = radiusUnits * perUnit;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
        const d2 = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
        const idx = y * w + x;
        if (d2 < r * r && d2 < best[idx]) {
          best[idx] = d2;
          data[idx] = TRACK.s[k] / TRACK.length;
        }
      }
    }
  }
  return { w, h, data };
}

/**
 * Downsample the print canvas so world positions can be mapped to rug colour (particles/trails tint).
 * @returns {{canvas:HTMLCanvasElement, at:(x:number,z:number)=>number[]}} at() gives [r,g,b] in 0..1
 */
export function makeColourLookup(source, width = 480) {
  const height = Math.round((width * RUG.H) / RUG.W);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  const px = ctx.getImageData(0, 0, width, height).data;
  return {
    canvas,
    at(x, z) {
      const ix = Math.max(0, Math.min(width - 1, Math.floor(((x + RUG.W / 2) / RUG.W) * width)));
      const iy = Math.max(0, Math.min(height - 1, Math.floor(((z + RUG.H / 2) / RUG.H) * height)));
      const i = (iy * width + ix) * 4;
      return [px[i] / 255, px[i + 1] / 255, px[i + 2] / 255];
    },
  };
}
