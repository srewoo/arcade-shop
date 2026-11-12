// Builds the closed centreline route of the procedural "sol" maps from a rounded polygon.
import { makeRouteFromPoints } from "./route.js";
import { MAP } from "../config/maps.js";
import { buildShapePoints } from "../logic/shapeRoutes.js";
import {
  WARP,
  BALL_CENTERS,
  TRACK_X,
  TRACK_Z,
  CORNER_R_BIG,
  warpPoint,
  arcPoints,
} from "./solTrack.js";

export { roundCorners, resamplePolyline, smoothClosedPath } from "./pathGeometry.js";
import { roundCorners, resamplePolyline, smoothClosedPath } from "./pathGeometry.js";

/** Alternate route polygons selected by warp.route ("ring" or the default "snake"-style). */
export function routeVariant(kind, ballA, ballB, ballC) {
  const X = TRACK_X;
  const Z = TRACK_Z;
  const R = CORNER_R_BIG;
  return kind === "ring"
    ? {
        start: [-70, Z],
        v: [[-70, Z, 0], [X, Z, R], [X, -Z, R], ...arcPoints(ballC, -15, -165, 18), [-X, -Z, R], [-X, Z, R]],
      }
    : {
        start: [0, Z],
        v: [
          [0, Z, 0],
          [46, Z, 15],
          ...arcPoints(ballB, 75, 15, 8),
          [86, 0, 0],
          [X, 0, 15],
          [X, -Z, R],
          ...arcPoints(ballC, -15, -165, 18),
          [-X, -Z, R],
          [-X, 0, 15],
          [-86, 0, 0],
          ...arcPoints(ballA, 165, 105, 8),
          [-46, Z, 15],
        ],
      };
}

/**
 * Build the route: polygon -> fillet -> resample 0.5 -> warp -> smooth (9, 3 passes)
 * -> rotate so index 0 is nearest the start point -> resample 1 -> optional reverse.
 */
export function buildSolRoute() {
  if (MAP.shape) return makeRouteFromPoints(buildShapePoints(WARP.route));
  const [ballA, ballB, ballC] = BALL_CENTERS;
  const variant = WARP.route ? routeVariant(WARP.route, ballA, ballB, ballC) : null;
  const verts = variant
    ? variant.v
    : [
        [-70, TRACK_Z, 0],
        [TRACK_X, TRACK_Z, CORNER_R_BIG],
        [TRACK_X, 0, 15],
        [86, 0, 0],
        ...arcPoints(ballB, -15, -75, 8),
        [46, -36, 0],
        [46, -TRACK_Z, 15],
        ...arcPoints(ballC, -15, -165, 18),
        [-46, -TRACK_Z, 15],
        [-46, -36, 0],
        ...arcPoints(ballA, -105, -165, 8),
        [-86, 0, 0],
        [-TRACK_X, 0, 15],
        [-TRACK_X, TRACK_Z, CORNER_R_BIG],
      ];
  let pts = resamplePolyline(roundCorners(verts), 0.5).map(([x, z]) => warpPoint(x, z));
  pts = smoothClosedPath(pts, 9, 3);
  const [sx, sz] = variant ? warpPoint(variant.start[0], variant.start[1]) : warpPoint(-70, TRACK_Z);
  let startIdx = 0;
  let best = 1e9;
  pts.forEach((p, i) => {
    const d = Math.hypot(p[0] - sx, p[1] - sz);
    if (d < best) {
      best = d;
      startIdx = i;
    }
  });
  pts = pts.slice(startIdx).concat(pts.slice(0, startIdx));
  pts = resamplePolyline(pts, 1);
  if (WARP.reverse) pts.reverse();
  return makeRouteFromPoints(pts);
}

/** Route of the procedural sol maps. RE: claude-base maps use routes.json centrelines instead. */
export const SOL_ROUTE = buildSolRoute();
