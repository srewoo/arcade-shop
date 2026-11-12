// "Sol" (living-room) map: scattered scenery lists - trees, fences, ducks, reeds,
// toy bricks, sofa legs, ball and cat crossings. Pure data + rejection sampling,
// all positions are in unwarped design space (warped later in solArrange.js).
import {
  SOL_BUILDINGS,
  SOL_PONDS,
  SOL_FIELDS,
  SOL_PARKING,
  SOL_HALF_X,
  SOL_HALF_Z,
  SOL_UNKNOWN_14,
  TRACK_X,
  TRACK_Z,
  BALL_CENTERS_COPY,
  SOL_ROADS,
  solRand,
  solRng,
} from "../solTrack.js";
import { mulberry32Signed } from "../../util/math.js";

/** Trees: {x, z, r, h, kind: "pine"|"round", shade, island?} */
export const solTrees = [];

/** True when a tree of radius `radius` at (x,z) would not overlap buildings, ponds, fields, parking or trees. */
function isTreeSpotFree(x, z, radius) {
  for (const b of SOL_BUILDINGS) if (Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius) return false;
  for (const p of SOL_PONDS)
    if (((x - p.x) / (p.rx + radius + 2)) ** 2 + ((z - p.z) / (p.rz + radius + 2)) ** 2 < 1) return false;
  for (const f of [...SOL_FIELDS, ...SOL_PARKING])
    if (Math.abs(x - f.x) < f.w / 2 + radius + 1 && Math.abs(z - f.z) < f.d / 2 + radius + 1) return false;
  for (const t of solTrees) if (Math.hypot(x - t.x, z - t.z) < t.r + radius + 0.8) return false;
  return true;
}

/** True when the tree stays clear of roads, the ring road, road stubs, roundabout islands and the rug edge. */
function isTreeSpotOffRoad(x, z, radius) {
  const clearance = SOL_UNKNOWN_14 / 2 + radius + 1.2; // RE: SOL_UNKNOWN_14 is the road width
  if (
    Math.abs(x) > SOL_HALF_X - 4 - radius ||
    Math.abs(z) > SOL_HALF_Z - 4 - radius ||
    ((Math.abs(z) < clearance || Math.abs(Math.abs(z) - TRACK_Z) < clearance) && Math.abs(x) < TRACK_X + clearance) ||
    (Math.abs(Math.abs(x) - TRACK_X) < clearance && Math.abs(z) < TRACK_Z + clearance) ||
    (Math.abs(Math.abs(x) - 46) < clearance && Math.abs(z) < TRACK_Z + clearance)
  )
    return false;
  for (const c of BALL_CENTERS_COPY) if (Math.hypot(x - c.x, z - c.z) < 24 + radius + 1.5) return false;
  for (const [ax, az, bx, bz] of SOL_ROADS) {
    const minX = Math.min(ax, bx) - clearance;
    const maxX = Math.max(ax, bx) + clearance;
    const minZ = Math.min(az, bz) - clearance;
    const maxZ = Math.max(az, bz) + clearance;
    if (x > minX && x < maxX && z > minZ && z < maxZ) return false;
  }
  return true;
}

/** Rejection-sample `count` trees inside the box, at most count*60 attempts. */
function scatterTrees(x0, x1, z0, z1, count, pineChance = 0.3) {
  let attempts = 0;
  let placed = 0;
  while (placed < count && attempts++ < count * 60) {
    const radius = solRand(2.6, 4.6);
    const x = solRand(x0, x1);
    const z = solRand(z0, z1);
    if (!isTreeSpotOffRoad(x, z, radius) || !isTreeSpotFree(x, z, radius)) continue;
    solTrees.push({
      x,
      z,
      r: radius,
      h: radius * solRand(2.4, 3.1),
      kind: solRng() < pineChance ? "pine" : "round",
      shade: solRng(),
    });
    placed++;
  }
}

// Roundabout islands get a fixed round tree each.
BALL_CENTERS_COPY.forEach((c) => solTrees.push({ x: c.x, z: c.z, r: 3.6, h: 12, kind: "round", shade: 0.75, island: true }));
// RE: BALL_CENTERS_COPY (zu) are the roundabout/island centres, despite the registry name.

scatterTrees(-109, -53, -61, -7, 22, 0.25);
scatterTrees(-39, 39, -61, -7, 14, 0.2);
scatterTrees(53, 109, -61, -7, 10, 0.2);
scatterTrees(53, 109, 7, 61, 16, 0.5);
scatterTrees(-109, -53, 7, 61, 6, 0.1);
scatterTrees(-39, 39, 7, 61, 4, 0.1);
scatterTrees(-136, 136, 76, 94, 16, 0.4);
scatterTrees(-136, 136, -94, -76, 14, 0.4);
scatterTrees(124, 136, -74, 74, 8, 0.5);
scatterTrees(-136, -124, -74, 74, 8, 0.5);

/** Fence segments {x1,z1,x2,z2}. */
export const solFences = [];
const addFence = (x1, z1, x2, z2) => solFences.push({ x1, z1, x2, z2 });
addFence(-35, 58, 35, 58);
addFence(-35, 13, -35, 58);
addFence(35, 13, 35, 58);
addFence(96, -60, 96, -44);
addFence(-108, 59.5, -54, 59.5);
addFence(-108, 30, -108, 59.5);
addFence(55, 58, 80, 58);
addFence(55, 38, 55, 58);

/** Duck spawn points. */
export const solDucks = [
  { x: -7, z: -21 },
  { x: 8, z: -26 },
  { x: -100, z: -36 },
  { x: 88, z: 36 },
  { x: 80, z: 41 },
];

/** Reeds around each pond: 26 per pond, seeded per pond with mulberry32Signed(77 + index). */
export const solReeds = [];
SOL_PONDS.forEach((pond, index) => {
  const rng = mulberry32Signed(77 + index);
  for (let i = 0; i < 26; i++) {
    const angle = rng() * Math.PI * 2;
    solReeds.push({
      x: pond.x + Math.cos(angle) * (pond.rx - 0.5),
      z: pond.z + Math.sin(angle) * (pond.rz - 0.5),
      h: 2 + rng() * 2.4,
    });
  }
});

/** Toy brick height. */
export const BRICK_H = 3;

/** Lego brick obstacles {x,z,w,d,color}. */
export const solBricks = [
  { x: 112, z: 28, w: 7, d: 10, color: "#e0352b" },
  { x: 46, z: -42, w: 8, d: 6.5, color: "#f3c21d" },
  { x: 92, z: -3.4, w: 10, d: 6.5, color: "#2d7fd6" },
  { x: -49, z: -48, w: 7, d: 11, color: "#3caa4f" },
  { x: -96, z: 3.6, w: 10, d: 6.5, color: "#f3c21d" },
  { x: 24, z: 64.5, w: 11, d: 6.5, color: "#e0352b" },
  { x: -119.5, z: 34, w: 6.5, d: 10, color: "#2d7fd6" },
];

/** Brick towers {x,z,n,color}. */
export const solTowers = [
  { x: 123.5, z: 60, n: 5, color: "#2d7fd6" },
  { x: -36, z: 76, n: 7, color: "#e0352b" },
  { x: 56, z: -76, n: 4, color: "#3caa4f" },
];

/** Sofa leg circles {x,z,r,h}. */
export const solSofaLegs = [
  { x: -80, z: -5.6, r: 6.2, h: 74 },
  { x: 74, z: 5.6, r: 6.2, h: 74 },
];

/** Rolling ball obstacle. */
export const solBall = { x: 60, z0: 132, z1: 30, r: 13 };

/** Cat crossing spawns {x,z,dx,dz}. */
export const solCatCrossings = [
  { x: -30, z: -68, dx: 0, dz: 1 },
  { x: 20, z: 68, dx: 0, dz: -1 },
  { x: 116, z: 32, dx: -1, dz: 0 },
  { x: -116, z: 40, dx: 1, dz: 0 },
];

