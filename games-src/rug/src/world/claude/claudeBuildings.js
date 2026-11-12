// Grid City buildings. Houses are randomised with a fixed-seed RNG (mulberry32(1234)); the call order
// below matters because every house consumes several random numbers.
import { mulberry32 } from "../../util/math.js";
import { ROUNDABOUTS } from "./claudeConfig.js";

const cityRng = mulberry32(1234);
const WALL_COLORS = ["#f3e3b5", "#f6f1e6", "#f2c84b", "#f2a7b6", "#a9d3ef", "#e9d2a6", "#c9e3a0"];
const ROOF_COLORS = ["#d8452f", "#e3882c", "#a9562f", "#3f70b8", "#d8452f", "#c23b2b", "#7b8590"];
const pickColor = (palette) => palette[Math.floor(cityRng() * palette.length)];

/** The cat: x position of a vertical exclusion strip (no houses/trees within ~10 units). */
export const CAT = { x: -52 };

/** Buildings: {kind,x,y,w,d,rot,wall,roof,h,...}. kind: house|post|hospital|gas|school|fire|police|barn|silo|fountain|stand */
export const BUILDINGS = [];

/**
 * Add a house at (x,y) facing `facing` (s/n/e/w). Skips the cat strip unless options.force.
 * Option fields override random values; options.kindAt[x] overrides per-x.
 */
function addHouse(x, y, facing, options = {}) {
  if (Math.abs(x - CAT.x) < 10.5 && !options.force) return;
  options.kindAt && options.kindAt[x] && Object.assign(options, options.kindAt[x]);
  const w = options.w ?? 7.5 + cityRng() * 1.6;
  const d = options.d ?? 6.2 + cityRng() * 1;
  const rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
  BUILDINGS.push({
    kind: options.kind ?? "house",
    x,
    y,
    w,
    d,
    rot,
    wall: options.wall ?? pickColor(WALL_COLORS),
    roof: options.roof ?? pickColor(ROOF_COLORS),
    h: options.h ?? 4.2 + cityRng() * 1.4,
    roofH: options.roofH ?? 2.6 + cityRng() * 0.8,
    chimney: cityRng() > 0.35,
    seed: Math.floor(cityRng() * 1e6),
  });
}

for (let i = 0; i < 5; i++) addHouse(-77 + i * 10, 14.5, "n");
for (let i = 0; i < 5; i++) addHouse(-77 + i * 10, 38.5, "s");
for (let x = -110; x <= -56; x += 10.5) addHouse(x, 67.5, "n");
for (let x = -26; x <= 0; x += 11) addHouse(x, 67.5, "n");
for (let x = 32; x <= 112; x += 10.5)
  addHouse(x, 67.5, "n", { kindAt: { 32: { kind: "post", wall: "#f2c84b", roof: "#d8452f", w: 9 } } });
addHouse(-106, -4, "e", { w: 8, d: 7 });
addHouse(-106, 58, "e", { w: 8, d: 7 });
addHouse(-106, -62, "e", { w: 8, d: 7 });
addHouse(-46, -14.5, "s", { w: 8, d: 6.5 });
addHouse(-36.5, -14.5, "s", { w: 7, d: 6.5 });

BUILDINGS.push({ kind: "hospital", x: -66, y: -33, w: 28, d: 15, rot: 0, wall: "#f7f5ef", roof: "#dfe2e6", h: 6.5 });
BUILDINGS.push({ kind: "gas", x: -70, y: -14.5, w: 17, d: 9, rot: 0, roof: "#f3f3f0", accent: "#e8452f", h: 5 });
BUILDINGS.push({
  kind: "school", x: 15, y: 66.5, w: 22, d: 9, rot: Math.PI,
  wall: "#f2c84b", roof: "#c23b2b", h: 6.5, roofH: 3, sign: "SCHOOL",
});
BUILDINGS.push({
  kind: "fire", x: 108, y: -15, w: 11, d: 9, rot: 0,
  wall: "#d8452f", roof: "#a9aeb6", h: 6, sign: "FIRE",
});
BUILDINGS.push({
  kind: "police", x: 108, y: 13.5, w: 11, d: 9, rot: Math.PI,
  wall: "#f7f5ef", roof: "#e9eef3", h: 6, sign: "POLICE",
});
BUILDINGS.push({
  kind: "barn", x: 3.5, y: -33, w: 12, d: 8, rot: Math.PI / 2,
  wall: "#c23b2b", roof: "#6b4a3a", h: 5, roofH: 4,
});
BUILDINGS.push({ kind: "silo", x: 3.5, y: -21.5, r: 2.6, h: 9, wall: "#c9ccd1", roof: "#7b8590" });
for (const roundabout of ROUNDABOUTS) BUILDINGS.push({ kind: "fountain", x: roundabout.x, y: roundabout.y, r: 3.6 });
BUILDINGS.push({ kind: "stand", x: 32, y: 10.6, w: 28, d: 4, rot: 0, wall: "#3f70b8", roof: "#f6f1e6", h: 3 });
