/**
 * Track sampling: turns the route object into dense Float32 arrays (position, arclength,
 * tangent, signed curvature) and provides pose / projection queries on them.
 * Also detects corners (for road arrows) and builds LEGO-brick obstacle records.
 * Original minified names in parentheses.
 */
import { BRICK_H, bricks, roundaboutRadius, roundabouts, route } from "./layoutSelect.js";

/** Route as [[x, z], ...]. (K2.pts / ns) */
const routePts = Array.from({ length: route.n }, (_, i) => [route.x[i], route.z[i]]);
/** Number of samples in the closed loop. (Ce) */
export const routeCount = routePts.length;

/**
 * Closed-loop track samples. x/y = world x/z; s = arclength; tx/ty = unit tangent;
 * curv = signed curvature = -(heading change over +-4 samples) / (8 * step). (At)
 */
export const TRACK = {
  n: routeCount,
  x: new Float32Array(routeCount),
  y: new Float32Array(routeCount),
  s: new Float32Array(routeCount),
  tx: new Float32Array(routeCount),
  ty: new Float32Array(routeCount),
  curv: new Float32Array(routeCount),
  length: 0,
  step: 1,
};

{
  const n = routeCount;
  let length = 0;
  for (let i = 0; i < n; i++) {
    TRACK.x[i] = routePts[i][0];
    TRACK.y[i] = routePts[i][1];
    TRACK.s[i] = length;
    const next = routePts[(i + 1) % n];
    length += Math.hypot(next[0] - routePts[i][0], next[1] - routePts[i][1]);
  }
  TRACK.length = length;
  TRACK.step = length / n;
  // central-difference tangents
  for (let i = 0; i < n; i++) {
    const prev = routePts[(i - 1 + n) % n];
    const next = routePts[(i + 1) % n];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    TRACK.tx[i] = dx / len;
    TRACK.ty[i] = dy / len;
  }
  // curvature: heading change between samples i-4 and i+4 over 8 steps (sign flipped)
  for (let i = 0; i < n; i++) {
    const before = (i - 4 + n) % n;
    const after = (i + 4) % n;
    const headingBefore = Math.atan2(TRACK.ty[before], TRACK.tx[before]);
    let delta = Math.atan2(TRACK.ty[after], TRACK.tx[after]) - headingBefore;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    TRACK.curv[i] = -delta / (8 * TRACK.step);
  }
}

/** Wrap an arclength into [0, length). (tf) */
export function wrapS(s) {
  const length = TRACK.length;
  return ((s % length) + length) % length;
}

/**
 * Pose at arclength s and lateral offset `lat` (left of travel is +, normal = (-ty, tx))
 * written into `out`: {x, y, tx, ty, a}. (Mr)
 */
export function trackPointAt(s, lat = 0, out = {}) {
  s = wrapS(s);
  const fi = s / TRACK.step;
  const i0 = Math.floor(fi) % routeCount;
  const i1 = (i0 + 1) % routeCount;
  const f = fi - Math.floor(fi);
  const x = TRACK.x[i0] + (TRACK.x[i1] - TRACK.x[i0]) * f;
  const y = TRACK.y[i0] + (TRACK.y[i1] - TRACK.y[i0]) * f;
  let tx = TRACK.tx[i0] + (TRACK.tx[i1] - TRACK.tx[i0]) * f;
  let ty = TRACK.ty[i0] + (TRACK.ty[i1] - TRACK.ty[i0]) * f;
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;
  out.x = x - ty * lat;
  out.y = y + tx * lat;
  out.tx = tx;
  out.ty = ty;
  out.a = Math.atan2(ty, tx);
  return out;
}

/**
 * Project (x, y) on the track. With no hint (hintIndex < 0) first scans every 2nd sample,
 * then refines in a +-4 window; otherwise searches +-window around hintIndex.
 * Returns {i, s, lat, dist}. (iu)
 */
export function projectOnTrack(x, y, hintIndex = -1, window = 40) {
  let best = 1e18;
  let bestIndex = 0;
  if (hintIndex < 0) {
    for (let i = 0; i < routeCount; i += 2) {
      const d2 = (TRACK.x[i] - x) ** 2 + (TRACK.y[i] - y) ** 2;
      if (d2 < best) {
        best = d2;
        bestIndex = i;
      }
    }
    hintIndex = bestIndex;
    window = 4;
  }
  best = 1e18;
  for (let k = -window; k <= window; k++) {
    const i = (hintIndex + k + routeCount) % routeCount;
    const d2 = (TRACK.x[i] - x) ** 2 + (TRACK.y[i] - y) ** 2;
    if (d2 < best) {
      best = d2;
      bestIndex = i;
    }
  }
  const dx = x - TRACK.x[bestIndex];
  const dy = y - TRACK.y[bestIndex];
  const along = dx * TRACK.tx[bestIndex] + dy * TRACK.ty[bestIndex];
  const lat = -dx * TRACK.ty[bestIndex] + dy * TRACK.tx[bestIndex];
  return { i: bestIndex, s: wrapS(TRACK.s[bestIndex] + along), lat, dist: Math.sqrt(best) };
}

/**
 * Corners: runs of samples with |curv| > 0.02 (merged when same sign and gap <= 9 samples),
 * kept when the total turn angle exceeds 0.5 rad. Flags corners that are roundabouts. (ws)
 */
export const turns = (() => {
  const runs = [];
  let run = null;
  for (let i = 0; i < routeCount; i++) {
    const c = TRACK.curv[i];
    if (Math.abs(c) > 0.02) {
      const sign = Math.sign(c);
      if (run && run.sign === sign && i - run.i1 <= 9) {
        run.i1 = i;
        run.angle += c * TRACK.step;
      } else {
        run = { i0: i, i1: i, sign, angle: c * TRACK.step };
        runs.push(run);
      }
    }
  }
  return runs
    .filter((r) => Math.abs(r.angle) > 0.5)
    .map((r) => {
      const mid = Math.floor((r.i0 + r.i1) / 2);
      const isRoundabout = roundabouts.some(
        (ring) => Math.hypot(TRACK.x[mid] - ring.x, TRACK.y[mid] - ring.y) < roundaboutRadius + 5,
      );
      return { ...r, s0: TRACK.s[r.i0], s1: TRACK.s[r.i1], roundabout: isRoundabout, dir: r.angle > 0 ? 1 : -1 };
    });
})();

/** LEGO brick obstacles: studs are ~3.3 units apart (see ROUTE_DASH_LATERAL elsewhere). (B0) */
export const legoBricks = bricks.map((b) => ({
  x: b.x,
  y: b.z,
  a: 0,
  sx: b.w,
  sy: b.d,
  h: BRICK_H,
  color: b.color,
  studs: [Math.max(1, Math.round(b.w / 3.3)), Math.max(1, Math.round(b.d / 3.3))],
}));
