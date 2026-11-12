import { describe, it, expect } from "vitest";
import { buildShapePoints, insideShape, clampToShape, SHAPES, shapeBallCenters, shapeZones } from "../src/logic/shapeRoutes.js";

const AI_ALAT_MIN = 76; // weakest AI lateral budget
const MIN_CORNER_SPEED = 20; // u/s the AI must be able to hold in the tightest corner

/** Radius of curvature at each point from the circumscribed circle of points k samples apart. */
function radii(pts, k = 4) {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - k + n) % n];
    const b = pts[(i + k) % n];
    const ab = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const bc = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ca = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const area2 = Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (p[1] - a[1]));
    return area2 < 1e-9 ? Infinity : (ab * bc * ca) / (2 * area2);
  });
}

describe.each([
  ["round", SHAPES.ellipse],
  ["runner", SHAPES.band],
])("%s route", (kind, shape) => {
  const pts = buildShapePoints(kind);
  it("is a closed loop with ~1 unit spacing", () => {
    expect(pts.length).toBeGreaterThan(300);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      expect(d).toBeGreaterThan(0.2);
      expect(d).toBeLessThan(1.6);
    }
  });
  it("does not cross itself", () => {
    const n = pts.length;
    for (let i = 0; i < n; i += 3)
      for (let j = i + 40; j < n; j += 3) {
        if (n - (j - i) < 40) continue;
        expect(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])).toBeGreaterThan(14);
      }
  });
  it("keeps every corner drivable at AI speeds (v = sqrt(aLat * r) >= 20 u/s)", () => {
    const rMin = Math.min(...radii(pts));
    expect(rMin).toBeGreaterThan(10);
    expect(Math.sqrt(AI_ALAT_MIN * rMin)).toBeGreaterThan(MIN_CORNER_SPEED);
  });
  it("stays inside the rug rectangle and the clip shape with room for the road", () => {
    for (const [x, z] of pts) {
      expect(Math.abs(x)).toBeLessThan(140 - 10);
      expect(Math.abs(z)).toBeLessThan(98 - 10);
      expect(insideShape(shape, x, z, 10)).toBe(true);
    }
  });
  it("places three roundabouts and scenery zones inside the shape", () => {
    const rings = shapeBallCenters(kind);
    expect(rings).toHaveLength(3);
    for (const r of rings) expect(insideShape(shape, r.x, r.z, 13)).toBe(true);
    for (const z of Object.values(shapeZones(kind))) {
      for (const [x, y] of [[z.x0, z.z0], [z.x1, z.z0], [z.x0, z.z1], [z.x1, z.z1]]) expect(insideShape(shape, x, y, 2)).toBe(true);
    }
  });
});

describe("shapes", () => {
  it("insideShape handles ellipse and rounded band", () => {
    expect(insideShape(SHAPES.ellipse, 0, 0)).toBe(true);
    expect(insideShape(SHAPES.ellipse, 133, 60)).toBe(false);
    expect(insideShape(SHAPES.band, 130, 0)).toBe(true);
    expect(insideShape(SHAPES.band, 135, 40)).toBe(false); // outside the rounded end
    expect(insideShape(SHAPES.band, 0, 47)).toBe(false);
    expect(insideShape(null, 9999, 9999)).toBe(true);
  });
  it("clampToShape moves outside points onto the boundary and leaves inside points alone", () => {
    expect(clampToShape(SHAPES.ellipse, 10, 10)).toEqual([10, 10, false]);
    for (const shape of [SHAPES.ellipse, SHAPES.band]) {
      const [x, z, moved] = clampToShape(shape, 500, 300, 3);
      expect(moved).toBe(true);
      expect(insideShape(shape, x, z, 2.9)).toBe(true);
    }
  });
});
