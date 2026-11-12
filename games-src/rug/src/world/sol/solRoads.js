// "Sol" map: road centre polylines (ring road, cross roads, stubs) in warped world space.
import { MAP } from "../../config/maps.js";
import { degToRad } from "../../util/math.js";
import { TRACK_X, TRACK_Z, CORNER_R_BIG, SOL_ROADS, warpPoint } from "../solTrack.js";
import { SOL_ROUTE } from "../solRoute.js";
import "./solScatter.js"; // must evaluate first: tree scattering reads SOL_ROADS before the pop() below

/** Warp a list of [x,z] points. */
const warpPoints = (points) => points.map(([x, z]) => warpPoint(x, z));

/** Ring road centreline: rounded rectangle, 12 steps per 90-degree corner, resampled every ~3 units. */
function ringRoadPoints() {
  const points = [];
  const hx = TRACK_X;
  const hz = TRACK_Z;
  const radius = CORNER_R_BIG;
  const corners = [
    [hx - radius, hz - radius, 90],
    [hx - radius, -hz + radius, 0],
    [-hx + radius, -hz + radius, -90],
    [-hx + radius, hz - radius, -180],
  ];
  for (const [cx, cz, startDeg] of corners)
    for (let step = 0; step <= 12; step++) {
      const angle = degToRad(startDeg - (step / 12) * 90);
      points.push([cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)]);
    }
  points.push(points[0]);
  const resampled = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 3);
    for (let k = 0; k < n; k++) resampled.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  resampled.push(resampled[0]);
  return resampled;
}

/** Straight segment sampled every ~3 units, endpoints inclusive. */
export function lineSamples(x0, z0, x1, z1) {
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 3);
  const out = [];
  for (let i = 0; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n]);
  return out;
}

// RE: arranged variants drop the last road stub (probably replaced by generated layout).
MAP.base === "sol" && MAP.arrange && SOL_ROADS.pop();

/** The route itself as a closed road polyline (shaped rugs have no other roads). */
const routeRoadLine = () => {
  const pts = [];
  for (let i = 0; i < SOL_ROUTE.n; i += 3) pts.push([SOL_ROUTE.x[i], SOL_ROUTE.z[i]]);
  pts.push(pts[0]);
  return pts;
};

/** Warped road centre polylines: ring, two horizontal/vertical axes at +-46, plus stubs. */
export const solRoadLines = MAP.shape
  ? [routeRoadLine()]
  : [
  warpPoints(ringRoadPoints()),
  warpPoints(lineSamples(-TRACK_X, 0, TRACK_X, 0)),
  warpPoints(lineSamples(-46, -TRACK_Z, -46, TRACK_Z)),
  warpPoints(lineSamples(46, -TRACK_Z, 46, TRACK_Z)),
  ...SOL_ROADS.map(([ax, az, bx, bz]) => warpPoints(lineSamples(ax, az, bx, bz))),
];

/** Junction points (warped). */
export const solJunctionPoints = MAP.shape
  ? []
  : [
  [116, 0],
  [-116, 0],
  [46, 68],
  [-46, 68],
  [46, -68],
  [-46, -68],
  ...SOL_ROADS.map(([x, z]) => [x, z]),
].map(([x, z]) => warpPoint(x, z));
