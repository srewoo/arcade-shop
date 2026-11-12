import { COLORS } from "../mapPainter.js";
import { INK } from "../paintHelpers.js";
import { distanceToRoad } from "../roadDistance.js";
import { houses, trees } from "../houseLayout.js";
import { roadWidth, RUG, railway, pondsPlanar, mainField, parkingRects, farmFields, footpaths } from "../layoutSelect.js";

/** True if (x, y) is clear of roads, railway, buildings, ponds, fields, lots, trees and paths. */
export function isFreeSpot(x, y) {
  if (distanceToRoad(x, y) < roadWidth / 2 + 1.6 || (railway && railway.some(([rx, ry]) => Math.hypot(x - rx, y - ry) < 6))) {
    return false;
  }
  for (const h of houses) {
    if (Math.hypot(x - h.x, y - h.y) < Math.max(h.w || 0, h.d || 0, (h.r || 0) * 2) * 0.75 + 3) return false;
  }
  for (const p of pondsPlanar) if (Math.hypot((x - p.x) / (p.rx + 3), (y - p.y) / (p.ry + 3)) < 1) return false;
  for (const rect of [mainField, ...parkingRects, ...farmFields]) {
    if (Math.abs(x - rect.x) < rect.w / 2 + 2 && Math.abs(y - rect.y) < rect.h / 2 + 2) return false;
  }
  for (const t of trees) if (Math.hypot(x - t.x, y - t.y) < t.r + 1.5) return false;
  for (const path of footpaths) for (const [px, py] of path) if (Math.hypot(x - px, y - py) < 1.8) return false;
  return true;
}

/** 320 random wild-flower dots then up to 190 round bushes (shared rng, order matters). */
export function paintRandomDecor(ctx, rng) {
  const halfW = RUG.W / 2;
  const halfH = RUG.H / 2;
  const border = RUG.border;
  for (let i = 0; i < 320; i++) {
    const x = (rng() * 2 - 1) * (halfW - border - 2);
    const y = (rng() * 2 - 1) * (halfH - border - 2);
    if (isFreeSpot(x, y)) {
      ctx.fillStyle = ["#e8452f", "#f6d23a", "#f39ab8", "#ffffff", "#9b6ad1"][Math.floor(rng() * 5)];
      ctx.beginPath();
      ctx.arc(x, y, 0.28 + rng() * 0.16, 0, 7);
      ctx.fill();
    }
  }
  let bushes = 0;
  for (let i = 0; i < 1400 && bushes < 190; i++) {
    const x = (rng() * 2 - 1) * (halfW - border - 3);
    const y = (rng() * 2 - 1) * (halfH - border - 3);
    if (!isFreeSpot(x, y)) continue;
    bushes++;
    const radius = 0.55 + rng() * 0.45;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(x, y, radius + 0.14, 0, 7);
    ctx.fill();
    ctx.fillStyle = rng() < 0.5 ? COLORS.tree : COLORS.treeMid;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 7);
    ctx.fill();
    if (rng() < 0.45) {
      ctx.fillStyle = ["#e8452f", "#f6d23a", "#f39ab8", "#ffffff"][Math.floor(rng() * 4)];
      ctx.beginPath();
      ctx.arc(x - radius * 0.25, y - radius * 0.25, 0.22, 0, 7);
      ctx.fill();
    }
  }
}
