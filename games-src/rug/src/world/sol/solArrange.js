// "Sol" map: applies the optional procedural arrangement (twist / mirror variants),
// warps every object list into world space and exports the frozen layout namespace
// (original `r2`) that the shared LAYOUT selector consumes.
import { MAP } from "../../config/maps.js";
import { mulberry32Signed } from "../../util/math.js";
import {
  WARP,
  SOL_HALF_X,
  SOL_HALF_Z,
  SOL_UNKNOWN_14,
  TRACK_X,
  TRACK_Z,
  CORNER_R_BIG,
  CORNER_R_ARC,
  BALL_CENTERS,
  SOL_ROADS,
  SOL_BUILDINGS,
  SOL_PONDS,
  SOL_FIELDS,
  SOL_PARKING,
  GRID_SLOTS,
  COTTAGE_PALETTES,
  warpPoint,
} from "../solTrack.js";
import { SOL_ROUTE, resamplePolyline, smoothClosedPath } from "../solRoute.js";
import { generateRandomLayout } from "../layoutGenerator.js";
import { shapeZones, insideShape, SHAPES } from "../../logic/shapeRoutes.js";
import { placeRouteProps, underSofaEdge } from "../routeProps.js";
import { makeRouteFromPoints } from "../route.js";
import {
  solTrees, solFences, solDucks, solReeds, BRICK_H, solBricks, solTowers,
  solSofaLegs, solBall, solCatCrossings,
} from "./solScatter.js";
import { solRoadLines, solJunctionPoints } from "./solRoads.js";

/** Procedural arrangement for variants that define `arrange`, else null. */
export const solArrangement =
  MAP.base === "sol" && MAP.arrange
    ? generateRandomLayout(
        MAP.arrange,
        MAP.shape
          ? shapeZones(WARP.route)
          : {
              A: { x0: -106, x1: -56, z0: -60, z1: -9 },
              B: { x0: -36, x1: 36, z0: -58, z1: -10 },
              C: { x0: 56, x1: 106, z0: -60, z1: -9 },
              D: { x0: -106, x1: -56, z0: 9, z1: 59 },
              E: { x0: -36, x1: 36, z0: 10, z1: 59 },
              F: { x0: 56, x1: 106, z0: 9, z1: 59 },
            },
        MAP.shape
          ? []
          : [
              { x0: -134, x1: 134, z0: 78, z1: 92 },
              { x0: -134, x1: 134, z0: -92, z1: -78 },
              { x0: 125, x1: 137, z0: -70, z1: 70 },
              { x0: -137, x1: -125, z0: -70, z1: 70 },
            ],
        MAP.seed,
        {
          route: SOL_ROUTE,
          warp: warpPoint,
          lines: solRoadLines,
          road: SOL_UNKNOWN_14,
          hx: SOL_HALF_X,
          hz: SOL_HALF_Z,
          inside: MAP.shape ? (x, z, margin) => insideShape(SHAPES[MAP.shape], x, z, margin) : undefined,
          rings: BALL_CENTERS.map((ring) => {
            const [x, z] = warpPoint(ring.x, ring.z);
            return { x, z, r: CORNER_R_ARC };
          }),
        },
      )
    : null;

if (solArrangement) {
  const islands = MAP.shape ? [] : solTrees.filter((tree) => tree.island);
  for (const [list, replacement] of [
    [SOL_BUILDINGS, solArrangement.houses],
    [SOL_PONDS, solArrangement.ponds],
    [SOL_FIELDS, solArrangement.fields],
    [SOL_PARKING, solArrangement.parking],
    [solFences, solArrangement.fences],
    [solTrees, [...islands, ...solArrangement.trees]],
    [solTowers, solArrangement.towers],
    [solDucks, solArrangement.ducks],
    [solReeds, solArrangement.reeds],
    [solBricks, []],
    [solSofaLegs, []],
    [solCatCrossings, []],
  ]) {
    list.length = 0;
    list.push(...replacement);
  }
}

/** Warp every object list from design space into world space, in place. */
function warpSolObjects() {
  const warpXZ = (o) => {
    const [x, z] = warpPoint(o.x, o.z);
    o.x = x;
    o.z = z;
  };
  [
    ...SOL_BUILDINGS, ...solTrees, ...SOL_PONDS, ...SOL_FIELDS, ...SOL_PARKING, ...solDucks,
    ...solReeds, ...solBricks, ...solTowers, ...solSofaLegs, ...solCatCrossings,
  ].forEach(warpXZ);
  for (const fence of solFences) {
    [fence.x1, fence.z1] = warpPoint(fence.x1, fence.z1);
    [fence.x2, fence.z2] = warpPoint(fence.x2, fence.z2);
  }
  BALL_CENTERS.forEach(warpXZ);
  const [ballX] = warpPoint(solBall.x, 68);
  solBall.x = ballX;
}
warpSolObjects();

/** Zebra crossing spots [x, z, horizontal?]. */
export const solZebraSpots = MAP.shape
  ? []
  : [
  [92, 0, true],
  [-70, 0, true],
  [16, 68, true],
  [-16, 0, true],
  [16, 0, true],
  [46, 30, false],
  [-46, 30, false],
  [116, 30, false],
];

/** Farm fields, warped. Default: a single wheat field. */
export const solFarmFields = solArrangement
  ? solArrangement.farm.map((field) => {
      const [x, y] = warpPoint(field.x, field.y);
      return { ...field, x, y };
    })
  : (() => {
      const [x, y] = warpPoint(69, 18);
      return [{ x, y, w: 24, h: 18, type: "wheat" }];
    })();

/** Cubic bezier sampled in 25 points, each passed through the warp. */
function bezierWarped(p0, p1, p2, p3) {
  const out = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    out.push(
      warpPoint(
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ),
    );
  }
  return out;
}

/** Footpaths: generated ones are placed relative to a warped anchor (mirrored when WARP.mirror). */
export const solPaths = solArrangement
  ? solArrangement.paths.map((path) => {
      const [ax, az] = warpPoint(path.x, path.z);
      return path.pts.map(([px, pz]) => [ax + px * (WARP.mirror ? -1 : 1), az + pz]);
    })
  : [
      bezierWarped([-58, -14], [-68, -5], [-70, -18], [-58, -28]),
      bezierWarped([58, 58], [80, 62], [100, 50], [108, 28]),
      bezierWarped([-30, -56], [-10, -46], [10, -46], [30, -56]),
    ];

/** Football stand; only on the default (non-arranged) layout. */
export const solStand = solArrangement
  ? null
  : { kind: "stand", x: SOL_FIELDS[0].x, y: SOL_FIELDS[0].z - SOL_FIELDS[0].d / 2 - 4.5, w: 44, d: 5, rot: 0, h: 4 };

/** Route props (bricks, sofa legs, cats, sofa underside) for arranged maps. */
export const solSofa = solArrangement ? placeRouteProps(SOL_ROUTE, SOL_BUILDINGS) : null;

if (solSofa) {
  solBricks.push(...solSofa.bricks);
  solSofaLegs.push(...solSofa.sofaLegs);
  solCatCrossings.push(...solSofa.cats);
  solBall.x = WARP.ballX;
  solBall.z1 = 34;
  const hitsBall = (x, z, radius) => underSofaEdge(solBall, x, z, radius);
  for (let i = SOL_BUILDINGS.length - 1; i >= 0; i--) {
    const b = SOL_BUILDINGS[i];
    if (hitsBall(b.x, b.z, (b.w ?? 10) / 2)) SOL_BUILDINGS.splice(i, 1);
  }
  for (let i = solTrees.length - 1; i >= 0; i--) {
    const t = solTrees[i];
    if (hitsBall(t.x, t.z, t.r) || solSofaLegs.some((leg) => Math.hypot(t.x - leg.x, t.z - leg.z) < leg.r + t.r + 1))
      solTrees.splice(i, 1);
  }
}
// RE: underSofaEdge (v0) is called as (ball, x, z, radius) and returns truthy when a circle touches the rolling ball.

export const solSofaBottom = solSofa ? solSofa.SOFA_BOTTOM : { x: -3, z: 0, w: 250, d: 74 };

/** Frozen layout namespace (original `r2`). Keys kept exactly as consumers read them. */
export const solLayoutModule = Object.freeze({
  BALL: solBall,
  BRICK_H,
  CAT_CROSSINGS: solCatCrossings,
  CORNER: CORNER_R_BIG,
  FARM_FIELDS: solFarmFields,
  GRID: GRID_SLOTS,
  HX: SOL_HALF_X,
  HZ: SOL_HALF_Z,
  JUNCTION_POINTS: solJunctionPoints,
  PALETTES: COTTAGE_PALETTES,
  PATHS: solPaths,
  RB_R: CORNER_R_ARC,
  RING_X: TRACK_X,
  RING_Z: TRACK_Z,
  ROAD: SOL_UNKNOWN_14,
  ROAD_LINES: solRoadLines,
  ROUNDABOUTS: BALL_CENTERS,
  SOFA_BOTTOM: solSofaBottom,
  STAND: solStand,
  STUBS: SOL_ROADS,
  ZEBRA_SPOTS: solZebraSpots,
  bricks: solBricks,
  ducks: solDucks,
  fences: solFences,
  fields: SOL_FIELDS,
  houses: SOL_BUILDINGS,
  makeRoute: makeRouteFromPoints,
  mulberry: mulberry32Signed,
  parking: SOL_PARKING,
  ponds: SOL_PONDS,
  reeds: solReeds,
  resampleClosed: resamplePolyline,
  route: SOL_ROUTE,
  smoothClosed: smoothClosedPath,
  sofaLegs: solSofaLegs,
  towers: solTowers,
  trees: solTrees,
  warp: warpPoint,
});
