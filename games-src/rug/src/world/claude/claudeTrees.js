// Grid City tree scattering (seed 777), distance-to-road query, brick spots, and the frozen
// layout namespace (original `v2`) consumed by the shared LAYOUT selector.
import { mulberry32 } from "../../util/math.js";
import { RUG, ROAD_W, ROAD_HALF, RING_R, ROUNDABOUTS, CR, PHI, ALPHA, FILLET_R, FILLET_DIST } from "./claudeConfig.js";
import { Turtle } from "./Turtle.js";
import { TRACK } from "./claudeTrack.js";
import { ROADS } from "./claudeRoads.js";
import { PONDS, FOOTBALL, PARKINGS, FARM_FIELDS, RAILWAY } from "./claudeScenery.js";
import { BUILDINGS, CAT } from "./claudeBuildings.js";
import { FENCES, PATHS } from "./claudeFences.js";
import { JUNCTIONS } from "./claudeRoads.js";

/** Flattened road segments plus 48-gon approximations of the roundabout rings. */
const roadSegments = [];
for (const road of ROADS) for (let i = 0; i < road.pts.length - 1; i++) roadSegments.push([road.pts[i], road.pts[i + 1]]);
for (const roundabout of ROUNDABOUTS)
  for (let i = 0; i < 48; i++) {
    const a0 = (i / 48) * Math.PI * 2;
    const a1 = ((i + 1) / 48) * Math.PI * 2;
    roadSegments.push([
      [roundabout.x + Math.cos(a0) * RING_R, roundabout.y + Math.sin(a0) * RING_R],
      [roundabout.x + Math.cos(a1) * RING_R, roundabout.y + Math.sin(a1) * RING_R],
    ]);
  }

/** Minimum distance from (x,y) to any road segment (brute force). */
export function distToRoad(x, y) {
  let best = 1e9;
  for (const [a, b] of roadSegments) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((x - a[0]) * dx + (y - a[1]) * dy) / lenSq;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = a[0] + dx * t - x;
    const ey = a[1] + dy * t - y;
    const distSq = ex * ex + ey * ey;
    if (distSq < best) best = distSq;
  }
  return Math.sqrt(best);
}

/** Brick piles {x,y,seed}. */
export const BRICK_PILES = [
  { x: -27, y: -17, seed: 3 },
  { x: 93, y: -21, seed: 9 },
  { x: -109, y: -48, seed: 5 },
];
/** Scattered trees {x,y,r,pine,hue,seed}. */
export const TREES = [];
/** Sofa legs (RE: legR = leg radius; used as obstacle in tree test). */
export const SOFA = {
  legs: [
    [-106, 22],
    [-106, -36],
  ],
  legR: 3.4,
};

/** True when a tree of radius r at (x,y) would hit any scenery. */
function isBlockedForTree(x, y, r) {
  for (const p of PONDS) {
    const ex = (x - p.x) / (p.rx + r + 1.5);
    const ey = (y - p.y) / (p.ry + r + 1.5);
    if (ex * ex + ey * ey < 1) return true;
  }
  const rects = [
    [FOOTBALL.x, FOOTBALL.y, FOOTBALL.w + 4, FOOTBALL.h + 4],
    ...PARKINGS.map((p) => [p.x, p.y, p.w + 1, p.h + 1]),
    ...FARM_FIELDS.map((f) => [f.x, f.y, f.w + 3, f.h + 3]),
  ];
  for (const b of BUILDINGS) {
    if (b.kind === "silo") {
      if (Math.hypot(x - b.x, y - b.y) < b.r + r + 1) return true;
      continue;
    }
    const w = Math.abs(Math.cos(b.rot)) > 0.5 ? b.w : b.d;
    const d = Math.abs(Math.cos(b.rot)) > 0.5 ? b.d : b.w;
    rects.push([b.x, b.y, w + 2, d + 2]);
  }
  for (const [cx, cy, w, h] of rects) if (Math.abs(x - cx) < w / 2 + r && Math.abs(y - cy) < h / 2 + r) return true;
  if (Math.abs(y - RAILWAY.y) < 4 + r) return true;
  for (const fence of FENCES) {
    const dx = fence.b[0] - fence.a[0];
    const dy = fence.b[1] - fence.a[1];
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((x - fence.a[0]) * dx + (y - fence.a[1]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    if (Math.hypot(fence.a[0] + dx * t - x, fence.a[1] + dy * t - y) < r + 0.6) return true;
  }
  for (const [lx, ly] of SOFA.legs) if (Math.hypot(x - lx, y - ly) < SOFA.legR + r + 1) return true;
  for (const pile of BRICK_PILES) if (Math.hypot(x - pile.x, y - pile.y) < 6 + r) return true;
  for (const path of PATHS) for (const [px, py] of path) if (Math.hypot(x - px, y - py) < r + 1.4) return true;
  return Math.abs(x - CAT.x) < 7 + r;
}

/** Candidate list: 10 around each pond, then 2600 uniform; keep up to 160 non-overlapping trees. */
function scatterTrees() {
  const rng = mulberry32(777);
  const limit = { x: RUG.W / 2 - RUG.border - 2.5, y: RUG.H / 2 - RUG.border - 2.5 };
  const candidates = [];
  for (const pond of PONDS)
    for (let i = 0; i < 10; i++) {
      const angle = rng() * Math.PI * 2;
      candidates.push([pond.x + Math.cos(angle) * (pond.rx + 4 + rng() * 3), pond.y + Math.sin(angle) * (pond.ry + 4 + rng() * 3)]);
    }
  for (let i = 0; i < 2600; i++) candidates.push([(rng() * 2 - 1) * limit.x, (rng() * 2 - 1) * limit.y]);
  for (const [x, y] of candidates) {
    if (TREES.length >= 160) break;
    if (Math.abs(x) > limit.x || Math.abs(y) > limit.y) continue;
    const r = 1.5 + rng() * 1.6;
    if (distToRoad(x, y) < ROAD_HALF + 1.1 + r || isBlockedForTree(x, y, r)) continue;
    let free = true;
    for (const t of TREES)
      if (Math.hypot(t.x - x, t.y - y) < t.r + r + 0.6) {
        free = false;
        break;
      }
    free && TREES.push({ x, y, r, pine: rng() < 0.22, hue: rng(), seed: Math.floor(rng() * 1e6) });
  }
}
scatterTrees();

/** Lego brick spots along the track: lat = lateral offset from centreline, studs [cols, rows]. */
export const BRICK_SPOTS = [
  { x: 35, y: -50, lat: 3.4, color: "#e3262c", studs: [4, 2], rot: 0.15 },
  { x: 10, y: 52, lat: -3.6, color: "#f2c21b", studs: [2, 2], rot: 0.6 },
  { x: -90, y: 26, lat: -3.2, color: "#2a6bd1", studs: [4, 2], rot: -0.3 },
  { x: -70, y: 0, lat: 3.6, color: "#1e9e4a", studs: [2, 2], rot: 0.9 },
  { x: 80, y: -26, lat: -3.4, color: "#f2f2ee", studs: [4, 2], rot: 1.2 },
];
export const BALL = { x: 32 };

/** Frozen layout namespace (original `v2`). */
export const claudeLayoutModule = Object.freeze({
  ALPHA,
  BALL,
  BRICK_PILES,
  BRICK_SPOTS,
  BUILDINGS,
  CAT,
  CR,
  FARM_FIELDS,
  FENCES,
  FILLET_DIST,
  FILLET_R,
  FOOTBALL,
  JUNCTIONS,
  PARKINGS,
  PATHS,
  PHI,
  PONDS,
  RAILWAY,
  RING_R,
  ROADS,
  ROAD_HALF,
  ROAD_W,
  ROUNDABOUTS,
  RUG,
  SOFA,
  TRACK,
  TREES,
  Turtle,
  distToRoad,
});
