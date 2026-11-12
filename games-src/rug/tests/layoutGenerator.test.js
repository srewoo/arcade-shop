import { describe, it, expect } from "vitest";
import { generateRandomLayout } from "../src/world/layoutGenerator.js";
import { SHAPES, insideShape, shapeZones } from "../src/logic/shapeRoutes.js";

const circleLine = (r, n = 90) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos((i / n) * 2 * Math.PI), r * 0.6 * Math.sin((i / n) * 2 * Math.PI)]);
const makeCtx = (extra = {}) => {
  const line = circleLine(80);
  return {
    lines: [line],
    rings: [],
    route: { n: 1, x: [0], z: [0], curv: [0] },
    warp: (x, z) => [x, z],
    hx: 140,
    hz: 98,
    road: 12,
    ...extra,
  };
};
const arrange = { A: "town", B: "shops", C: "lake", D: "town", E: "civic", F: "farm", G: "town", H: "shops", I: "town", J: "town" };
const run = (ctx) => generateRandomLayout(arrange, shapeZones("round"), [], 71, ctx);

describe("scenery generator on a shaped rug", () => {
  it("keeps every house and tree on the cloth when a shape test is given", () => {
    const shape = SHAPES.ellipse;
    const out = run(makeCtx({ inside: (x, z, m) => insideShape(shape, x, z, m) }));
    expect(out.houses.length).toBeGreaterThan(5);
    for (const h of out.houses) expect(insideShape(shape, h.wx, h.wz, 0)).toBe(true);
    for (const t of out.trees) expect(insideShape(shape, t.x, t.z, 0)).toBe(true);
  });
  it("is deterministic for a seed", () => {
    const shape = SHAPES.ellipse;
    const a = run(makeCtx({ inside: (x, z, m) => insideShape(shape, x, z, m) }));
    const b = run(makeCtx({ inside: (x, z, m) => insideShape(shape, x, z, m) }));
    expect(b.trees).toEqual(a.trees);
    expect(b.houses.map((h) => [h.wx, h.wz])).toEqual(a.houses.map((h) => [h.wx, h.wz]));
  });
  it("the second tree pass only runs for shaped rugs: no shape test = original tree cap", () => {
    const plain = run(makeCtx());
    expect(plain.trees.length).toBeLessThanOrEqual(125);
    const shaped = run(makeCtx({ inside: (x, z, m) => insideShape(SHAPES.ellipse, x, z, m) }));
    expect(shaped.trees.length).toBeGreaterThan(20);
  });
  it("the extra outer-ring zones lie inside the ellipse", () => {
    for (const id of ["G", "H", "I", "J"]) {
      const z = shapeZones("round")[id];
      for (const [x, y] of [[z.x0, z.z0], [z.x1, z.z0], [z.x0, z.z1], [z.x1, z.z1]]) expect(insideShape(SHAPES.ellipse, x, y, 2)).toBe(true);
    }
  });
});
