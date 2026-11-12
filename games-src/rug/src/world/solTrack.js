// Procedural "sol" (town rug) track constants, coordinate warp and legacy hand-placed scenery data.
import { MAP } from "../config/maps.js";
import { mulberry32Signed, degToRad } from "../util/math.js";
import { shapeBallCenters } from "../logic/shapeRoutes.js";

/** Warp parameters: only the "sol" base maps are warped; claude maps use identity (a:1,f:1,p:0, unused). */
export const WARP = MAP.base === "sol" ? MAP.warp : { a: 1, f: 1, p: 0 };

export const SOL_HALF_X = 140;
export const SOL_HALF_Z = 98;
export const SOL_UNKNOWN_14 = 14; // RE: not used in this range; possibly a margin/zone size elsewhere
export const TRACK_X = 116;
export const TRACK_Z = 68;
export const CORNER_R_BIG = 26;
export const CORNER_R_ARC = 13; // radius used when going round a ball (arcPoints)

/** Three "ball" obstacles (track bends around them). */
export const BALL_CENTERS = [
  { x: -46, z: 0 },
  { x: 46, z: 0 },
  { x: 0, z: -TRACK_Z },
];
// Shaped rugs: the three roundabouts sit tangent to the generated route instead of the original spots.
if (MAP.shape) shapeBallCenters(MAP.warp.route).forEach((c, i) => Object.assign(BALL_CENTERS[i], c));

/** Copy of the ball centres (original `zu`), used by the warp so warp stays pinned near balls. */
export const BALL_CENTERS_COPY = BALL_CENTERS.map((b) => ({ ...b }));

/** Straight road segments [x1, z1, x2, z2] of the base sol layout. */
export const SOL_ROADS = [
  [-80, TRACK_Z, -80, SOL_HALF_Z + 3],
  [88, TRACK_Z, 88, SOL_HALF_Z + 3],
  [-76, -TRACK_Z, -76, -SOL_HALF_Z - 3],
  [76, -TRACK_Z, 76, -SOL_HALF_Z - 3],
  [TRACK_X, -26, SOL_HALF_X + 3, -26],
  [-TRACK_X, -10, -SOL_HALF_X - 3, -10],
  [46, -35, TRACK_X, -35],
];

if (MAP.shape) SOL_ROADS.length = 0; // no hand-placed stubs/axes on shaped rugs: the route is the only road

export const smoothstep01 = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Low-frequency sinusoidal displacement for (x, z) (original `kd`). */
export function warpOffset(x, z) {
  return [
    WARP.a *
      (8 * Math.sin(z * 0.033 * WARP.f + 0.7 + WARP.p) + 4 * Math.sin((z * 0.071 + x * 0.02) * WARP.f + 2 + WARP.p)),
    WARP.a *
      (9 * Math.sin(x * 0.031 * WARP.f + 1.4 + WARP.p) + 5 * Math.sin((x * 0.067 + z * 0.024) * WARP.f + WARP.p)),
  ];
}

/**
 * Warp a base-layout point to its final position. Near each ball centre (26..62 units) the
 * displacement blends to the displacement *at the ball centre*, keeping balls rigidly placed.
 * Optionally mirrored in x.
 */
export function warpPoint(x, z) {
  let [ox, oz] = warpOffset(x, z);
  for (const b of BALL_CENTERS_COPY) {
    const k = smoothstep01(26, 62, Math.hypot(x - b.x, z - b.z));
    const [bx, bz] = warpOffset(b.x, b.z);
    ox = bx + (ox - bx) * k;
    oz = bz + (oz - bz) * k;
  }
  return [(x + ox) * (WARP.mirror ? -1 : 1), z + oz];
}

/** Arc of `steps+1` vertices [x, z, 0] around ball `centre` from angle `a0` to `a1` (degrees). */
export function arcPoints(centre, a0, a1, steps = 14) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = degToRad(a0 + ((a1 - a0) * i) / steps);
    pts.push([centre.x + CORNER_R_ARC * Math.cos(a), centre.z + CORNER_R_ARC * Math.sin(a), 0]);
  }
  return pts;
}

/** The four start-grid slots: s = distance along route (behind start line), lat = lateral offset. */
export const GRID_SLOTS = [
  { s: -8, lat: -3.3 },
  { s: -8, lat: 3.3 },
  { s: -16, lat: -3.3 },
  { s: -16, lat: 3.3 },
];

// RE: seeded RNG helpers for the legacy sol scatter; `solRand` uses a fixed seed (20241).
export const solRng = mulberry32Signed(20241);
export const solRand = (a, b) => a + (b - a) * solRng();

export const COTTAGE_PALETTES = [
  { wall: "#f4e6c4", roof: "#d8402f", roof2: "#b83226", door: "#7a4a2a", trim: "#fff7e4" },
  { wall: "#f6cf55", roof: "#2f6fc0", roof2: "#265a9e", door: "#b8402f", trim: "#fff2c0" },
  { wall: "#f8f4ea", roof: "#ec8a2c", roof2: "#cc6f1d", door: "#3f7f4b", trim: "#ffffff" },
  { wall: "#f2a9a2", roof: "#6f5a8f", roof2: "#5a4877", door: "#f4e6c4", trim: "#ffe9e4" },
];

export const SOL_PONDS = [
  { x: 0, z: -23, rx: 25, rz: 12.5, seed: 1.2 },
  { x: -84, z: -38, rx: 21, rz: 16, seed: 2.6, island: true },
  { x: 86, z: 38, rx: 18, rz: 13, seed: 4.1 },
];
export const SOL_FIELDS = [{ x: 0, z: 35, w: 62, d: 37 }];
export const SOL_PARKING = [{ x: -81, z: 44, w: 50, d: 28 }];

/** Hand-placed buildings of the base sol map: {kind,x,z,w,d,h,pal(palette index)}. */
export const SOL_BUILDINGS = [];
const addBuilding = (kind, x, z, w, d, h, pal) => SOL_BUILDINGS.push({ kind, x, z, w, d, h, pal });

addBuilding("cottage", 68, -50, 15, 12, 12, 0);
addBuilding("cottage", 87, -50, 15, 12, 13, 1);
addBuilding("tall", 104, -48, 10, 13, 18, 2);
addBuilding("tall", 106, -20, 8, 11, 17, 0);
addBuilding("carousel", 84, -16.5, 19, 19, 15, 0);
addBuilding("shop", -81, 20, 36, 12, 11, 2);
addBuilding("mill", 66, 46, 15, 12, 14, 0);
addBuilding("cottage", 104, 16, 9, 8, 8, 1);
addBuilding("castle", -84, -39, 15, 13, 23, 0);
addBuilding("cottage", -103, -18, 9, 8, 8, 3);
[-118, -96, -66, -34, 8, 34, 72, 102, 124].forEach((x, i) => {
  const wide = i % 2 === 0;
  addBuilding(i % 3 === 2 ? "tall" : "cottage", x, 88, wide ? 15 : 12, 11, wide ? 12 : 15, (i * 3 + 1) % 4);
});
[-122, -92, -60, 60, 92, 122].forEach((x, i) => addBuilding("cottage", x, -86, 14, 10, 11, (i * 3 + 2) % 4));
[-44, -8, 26].forEach((z, i) => addBuilding("cottage", 131.5, z, 10, 13, 10, (i + 1) % 4));
[-44, 26, 46].forEach((z, i) => addBuilding("cottage", -131.5, z, 10, 13, 10, (i + 2) % 4));
