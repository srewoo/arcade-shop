// Road/water raster mask used for gameplay surface queries (grip, splash, off-rug).
import { RUG, roadWidth, roundaboutRadius, roads, roundabouts, junctionPoints, parkingRects, pondsPlanar } from "./layoutSelect.js";
import { COLLISION_SCALE } from "./mapPainter.js";
import { createCanvas, applyWorldTransform, strokePolyline, pondPath } from "./paint/canvasUtils.js";

/**
 * Rasterise roads (red channel) and water (green channel) at COLLISION_SCALE px per world unit.
 * @returns {{w:number,h:number,road:Uint8Array,water:Uint8Array}}
 */
export function buildRoadWaterMask() {
  const w = RUG.W * COLLISION_SCALE;
  const h = RUG.H * COLLISION_SCALE;
  const ctx = createCanvas(w, h).getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  applyWorldTransform(ctx, w);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#f00";
  ctx.lineWidth = roadWidth + 1;
  ctx.fillStyle = "#f00";
  for (const road of roads) strokePolyline(ctx, road.pts);
  for (const r of roundabouts) { ctx.beginPath(); ctx.arc(r.x, r.y, roundaboutRadius, 0, 7); ctx.stroke(); }
  for (const [x, y] of junctionPoints) { ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#000";
  // roundabout centre islands are not road
  for (const r of roundabouts) { ctx.beginPath(); ctx.arc(r.x, r.y, roundaboutRadius - 6.6, 0, 7); ctx.fill(); }
  for (const p of parkingRects) { ctx.fillStyle = "#f00"; ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h); }
  ctx.fillStyle = "#0f0";
  for (const pond of pondsPlanar) { pondPath(ctx, pond); ctx.fill(); }
  ctx.fillStyle = "#000";
  for (const pond of pondsPlanar) {
    if (pond.island) { ctx.beginPath(); ctx.ellipse(pond.x, pond.y, 13, 11, 0, 0, 7); ctx.fill(); }
  }
  const px = ctx.getImageData(0, 0, w, h).data;
  const road = new Uint8Array(w * h);
  const water = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { road[i] = px[i * 4]; water[i] = px[i * 4 + 1]; }
  return { w, h, road, water };
}

/**
 * Sample the mask at world (x,z). Values are 0..1; `off` is true outside the rug.
 */
export function sampleSurfaceMask(mask, x, z) {
  const ix = Math.floor((x + RUG.W / 2) * COLLISION_SCALE);
  const iy = Math.floor((z + RUG.H / 2) * COLLISION_SCALE);
  if (ix < 0 || iy < 0 || ix >= mask.w || iy >= mask.h) return { road: 0, water: 0, off: true };
  const i = iy * mask.w + ix;
  return { road: mask.road[i] / 255, water: mask.water[i] / 255, off: false };
}
