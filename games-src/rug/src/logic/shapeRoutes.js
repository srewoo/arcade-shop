// Procedural routes and clip shapes for the non-rectangular rugs ("round" oval rug, "runner" strip rug).
// Pure geometry (no three, no DOM) so it can be unit tested; the game consumes buildShapePoints().
import { roundCorners, resamplePolyline, smoothClosedPath } from "../world/pathGeometry.js";

/** Rug clip shapes in world units around the rug centre (the rug canvas stays 280 x 196). */
export const SHAPES = Object.freeze({
  ellipse: { kind: "ellipse", rx: 134, rz: 93 },
  band: { kind: "band", hx: 136, hz: 46 },
});

/** True when (x,z) lies inside the shape shrunk by `margin` world units. */
export function insideShape(shape, x, z, margin = 0) {
  if (!shape) return true;
  if (shape.kind === "ellipse") return (x / (shape.rx - margin)) ** 2 + (z / (shape.rz - margin)) ** 2 <= 1;
  const hx = shape.hx - margin;
  const hz = shape.hz - margin;
  if (Math.abs(z) > hz) return false;
  const cx = hx - hz; // rounded ends: semicircles of radius hz
  return Math.abs(x) <= cx || Math.hypot(Math.abs(x) - cx, z) <= hz;
}

/** Pull (x,z) back inside the shape (margin in units); returns [x, z, moved]. */
export function clampToShape(shape, x, z, margin = 3) {
  if (insideShape(shape, x, z, margin)) return [x, z, false];
  if (shape.kind === "ellipse") {
    const k = 1 / Math.sqrt((x / (shape.rx - margin)) ** 2 + (z / (shape.rz - margin)) ** 2);
    return [x * k, z * k, true];
  }
  const hx = shape.hx - margin;
  const hz = shape.hz - margin;
  const cx = hx - hz;
  if (Math.abs(x) <= cx) return [x, Math.sign(z) * hz, true];
  const dx = Math.abs(x) - cx;
  const k = hz / Math.hypot(dx, z);
  return [Math.sign(x) * (cx + dx * k), z * k, true];
}

/** Bean loop (ellipse with a dent on the +z side), sampled as a closed polyline. */
function beanPolyline() {
  const pts = [];
  for (let i = 0; i < 360; i++) {
    const t = (i / 360) * Math.PI * 2;
    const d = (t - Math.PI / 2) / 0.55;
    pts.push([100 * Math.cos(t), 62 * Math.sin(t) - 24 * Math.exp(-d * d)]);
  }
  return pts;
}

/** Stadium-shaped strip with chicanes on both long sides and tight U-turn hairpins at the ends. */
function runnerVertices() {
  return [
    [110, 28, 28],
    [64, 28, 12],
    [44, 14, 12],
    [-8, 14, 12],
    [-28, 28, 12],
    [-110, 28, 28],
    [-110, -28, 28],
    [-64, -28, 12],
    [-44, -14, 12],
    [8, -14, 12],
    [28, -28, 12],
    [110, -28, 28],
  ];
}

/**
 * Final closed centreline (1 unit spacing, start point first) for a shape map.
 * @param {"round"|"runner"} kind
 * @returns {number[][]} [[x,z], ...]
 */
export function buildShapePoints(kind) {
  const raw = kind === "round" ? beanPolyline() : roundCorners(runnerVertices());
  let pts = resamplePolyline(raw, 0.5);
  pts = smoothClosedPath(pts, 9, 3);
  const start = kind === "round" ? [-100, 0] : [-70, 28];
  let startIdx = 0;
  let best = 1e9;
  pts.forEach((p, i) => {
    const d = Math.hypot(p[0] - start[0], p[1] - start[1]);
    if (d < best) {
      best = d;
      startIdx = i;
    }
  });
  pts = pts.slice(startIdx).concat(pts.slice(0, startIdx));
  return resamplePolyline(pts, 1);
}

/** Three roundabout rings (radius `r`) tangent to the route on its inside, spread around the loop. */
export function shapeBallCenters(kind, r = 13) {
  const pts = buildShapePoints(kind);
  const area = pts.reduce((a, p, i) => a + (p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1]), 0);
  const inward = Math.sign(area) || 1; // counter-clockwise (area>0): left normal points inside
  return [0.2, 0.5, 0.8].map((f) => {
    const i = Math.floor(pts.length * f);
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const len = Math.hypot(tx, tz);
    return { x: pts[i][0] + (-tz / len) * r * inward, z: pts[i][1] + (tx / len) * r * inward };
  });
}

/** Scenery zones (letters A-F, rectangles) that lie inside the shape and mostly between road lanes. */
export function shapeZones(kind) {
  if (kind === "round") {
    return {
      A: { x0: -84, x1: -40, z0: -32, z1: 4 },
      B: { x0: -30, x1: 30, z0: -46, z1: -8 },
      C: { x0: 40, x1: 84, z0: -32, z1: 4 },
      D: { x0: -80, x1: -44, z0: 12, z1: 36 },
      E: { x0: -22, x1: 22, z0: 4, z1: 22 },
      F: { x0: 44, x1: 80, z0: 12, z1: 36 },
      // outer ring between the road and the rug edge: top / bottom bands and the two end strips
      G: { x0: -40, x1: 40, z0: -84, z1: -72 },
      H: { x0: -40, x1: 40, z0: 72, z1: 84 },
      I: { x0: -124, x1: -112, z0: -26, z1: 26 },
      J: { x0: 112, x1: 124, z0: -26, z1: 26 },
    };
  }
  return {
    A: { x0: -96, x1: -62, z0: -10, z1: 10 },
    B: { x0: -54, x1: -26, z0: -6, z1: 6 },
    C: { x0: -16, x1: 18, z0: -4, z1: 4 },
    D: { x0: 28, x1: 54, z0: -6, z1: 6 },
    E: { x0: 62, x1: 96, z0: -10, z1: 10 },
    F: { x0: -12, x1: 12, z0: 36, z1: 44 },
  };
}
