// Grid City fences around farm fields and footpath curves.
import { FARM_FIELDS } from "./claudeScenery.js";

/** Fence segments {a:[x,y], b:[x,y], color}. */
export const FENCES = [];

/** Rectangle fence centred at (cx,cy); the `gate` side ("n"|"e"|"s"|"w") is split with a gap of `gap` units. */
function addFieldFence(cx, cy, width, depth, color, gate = "s", gap = 3) {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const top = cy - depth / 2;
  const bottom = cy + depth / 2;
  const sides = {
    n: [[left, top], [right, top]],
    e: [[right, top], [right, bottom]],
    s: [[right, bottom], [left, bottom]],
    w: [[left, bottom], [left, top]],
  };
  for (const side of ["n", "e", "s", "w"]) {
    const [a, b] = sides[side];
    if (side === gate) {
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / length;
      const uy = (b[1] - a[1]) / length;
      FENCES.push({ a, b: [mx - (ux * gap) / 2, my - (uy * gap) / 2], color });
      FENCES.push({ a: [mx + (ux * gap) / 2, my + (uy * gap) / 2], b, color });
    } else FENCES.push({ a, b, color });
  }
}

for (const field of FARM_FIELDS)
  addFieldFence(field.x, field.y, field.w + 1.6, field.h + 1.6, "#8a5a33", field.type === "corn" ? "n" : "s");
FENCES.push({ a: [-82, 9], b: [-82, 24], color: "#f6f3ea" });

/** Sample [x, fn(x)] every 1 unit from x0 to x1 inclusive. */
function sampleCurve(x0, x1, fn) {
  const out = [];
  for (let x = x0; x <= x1 + 0.01; x += 1) out.push([x, fn(x)]);
  return out;
}

/** Footpath polylines. */
export const PATHS = [
  sampleCurve(-82, -30, (x) => 26 + 1.4 * Math.sin((x + 82) / 6.5)),
  sampleCurve(8, 58, (x) => 42.9 + 0.5 * Math.sin(x / 5)),
  sampleCurve(-60, -27, (x) => -20.2 + 0.7 * Math.sin((x + 60) / 5)),
  (() => {
    const out = [];
    for (let y = -50; y <= 50; y += 1) out.push([-112.6 + 1 * Math.sin(y / 6), y]);
    return out;
  })(),
];
