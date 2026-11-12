/**
 * Final house / tree / fence placement lists derived from the active layout, filtered
 * against roads, ponds, fields and the rug border. Original minified names in parentheses.
 */
import { clearOfRoads, distanceToRoad, insideRug } from "./roadDistance.js";
import { LAYOUT, ROAD_WIDTH, farmFields, ponds } from "./layoutSelect.js";

/** Art scale applied to legacy house kinds. (J2) */
const HOUSE_ART_SCALE = 1.5;

/**
 * Normalise a layout house record into the uniform shape the builders consume
 * (wall/roof colours from palette, art scale, roof height ...). (Q2)
 */
function normalizeHouse(house, index) {
  if (house.ready) return { ...house, y: house.z ?? house.y };
  const palette = LAYOUT.PALETTES[house.pal];
  const base = {
    x: house.x,
    y: house.z,
    w: house.w,
    d: house.d,
    rot: 0,
    seed: 1e3 + index * 77,
    art: HOUSE_ART_SCALE,
    wall: palette.wall,
    roof: palette.roof,
  };
  switch (house.kind) {
    case "shop":
      return { ...base, kind: "shop", h: house.h * 0.82, accent: "#d8402f" };
    case "castle":
      return { ...base, kind: "castle", h: house.h };
    case "carousel":
      return { ...base, kind: "carousel", h: house.h, r: house.w / 2 };
    default: {
      const wallFraction = house.kind === "tall" ? 0.72 : 0.6;
      return {
        ...base,
        kind: house.kind === "mill" ? "mill" : "house",
        h: house.h * wallFraction,
        roofH: house.h * (1 - wallFraction),
        chimney: true,
      };
    }
  }
}

const stand = LAYOUT.STAND; // (dl)

/** Is (x, z) inside any pond (ellipse expanded by 2)? (tS) */
const insidePond = (x, z) =>
  ponds.some((p) => ((x - p.x) / (p.rx + 2)) ** 2 + ((z - p.z) / (p.rz + 2)) ** 2 < 1);

/** Does the house footprint fit (not on road/pond; castles only need to be inside the rug)? (eS) */
function houseFits(house) {
  const rotated = Math.abs(Math.sin(house.rot || 0)) > 0.5;
  const halfX = house.r ?? (rotated ? house.d : house.w) / 2;
  const halfZ = house.r ?? (rotated ? house.w : house.d) / 2;
  return house.kind === "fountain"
    ? true
    : house.kind === "castle"
      ? insideRug(house.x, house.y, halfX, halfZ)
      : clearOfRoads(house.x, house.y, halfX, halfZ) && !insidePond(house.x, house.y);
}

/** Final buildings list. (Go) */
export const houses = [...LAYOUT.houses.map(normalizeHouse), ...(stand ? [stand] : [])].filter(houseFits);

/** Does tree `t` (radius + margin e) overlap rect `r`? (nS) */
const treeBlockedBy = (tree, rect, margin) =>
  Math.abs(tree.x - rect.x) < rect.w / 2 + margin && Math.abs(tree.z - rect.y) < (rect.h ?? rect.d) / 2 + margin;

const treeBlockers = [...farmFields, ...(stand ? [stand] : [])]; // (iS)

/** Final trees {x,y,r,h,pine,hue,seed,island}. (Ol) */
export const trees = LAYOUT.trees
  .filter((t) => t.island || (insideRug(t.x, t.z, t.r, t.r) && distanceToRoad(t.x, t.z) > ROAD_WIDTH / 2 + 1.5))
  .filter((t) => !treeBlockers.some((rect) => treeBlockedBy(t, rect, t.r + 0.5)))
  .map((t, i) => ({
    x: t.x,
    y: t.z,
    r: t.r,
    h: t.h,
    pine: t.kind === "pine",
    hue: t.shade,
    seed: 5e3 + i * 131,
    island: !!t.island,
  }));

/**
 * Fence runs: every fence is sampled at ~1 unit and split into pieces that stay off the
 * road (road/2 + 2.2); pieces shorter than 3 units are dropped. (kl)
 */
export const fenceSegments = [];
for (const fence of LAYOUT.fences) {
  const length = Math.hypot(fence.x2 - fence.x1, fence.z2 - fence.z1);
  const steps = Math.ceil(length);
  const color = fence.color ?? "#f6f3ea";
  let run = null;
  for (let i = 0; i <= steps + 1; i++) {
    const t = Math.min(1, i / steps);
    const x = fence.x1 + (fence.x2 - fence.x1) * t;
    const z = fence.z1 + (fence.z2 - fence.z1) * t;
    if (i <= steps && distanceToRoad(x, z) > ROAD_WIDTH / 2 + 2.2) {
      if (run) run.b = [x, z];
      else run = { a: [x, z], b: [x, z], color };
    } else if (run) {
      if (Math.hypot(run.b[0] - run.a[0], run.b[1] - run.a[1]) > 3) fenceSegments.push(run);
      run = null;
    }
  }
}
