// Seeded random scenery layout for maps that define `arrange` (zone letter -> scenery kind).
import { mulberry32 } from "../util/math.js";
import { createZoneKinds } from "./layoutZones.js";

export const HOUSE_PALETTES = [
  { wall: "#f4e6c4", roof: "#d8402f" },
  { wall: "#f6cf55", roof: "#2f6fc0" },
  { wall: "#f8f4ea", roof: "#ec8a2c" },
  { wall: "#f2a9a2", roof: "#6f5a8f" },
  { wall: "#a9d3ef", roof: "#3f70b8" },
  { wall: "#c9e3a0", roof: "#a9562f" },
];
/** Colours for towers (and brick piles). */
export const ACCENT_COLORS = ["#e0352b", "#f3c21d", "#2d7fd6", "#3caa4f", "#f2f2ee"];

/**
 * @param arrange  {zoneId: kind}
 * @param zones    {zoneId: {x0,z0,x1,z1}}
 * @param gaps     extra rectangles {x0,z0,x1,z1} to fill with houses / try ponds in
 * @param seed     integer seed for mulberry32
 * @param ctx      {lines: point[][] road polylines, rings: {x,z,r}[] roundabouts, route, warp(x,z)->[wx,wz],
 *                  hx, hz (half extents), road (road width)}
 * @returns {houses, ponds, fields, parking, farm, fences, trees, towers, ducks, reeds, paths}
 */
export function generateRandomLayout(arrange, zones, gaps, seed, ctx) {
  const rand = mulberry32(seed);

  // Road segment list (each polyline sub-sampled to ~60 segments) for the distance field.
  const segments = [];
  for (const line of ctx.lines) {
    const step = Math.max(1, Math.floor(line.length / 60));
    for (let i = 0; i + step < line.length; i += step) segments.push([line[i], line[i + step]]);
  }
  /** Distance from (x,z) to nearest road centreline or roundabout ring. */
  function distToRoad(x, z) {
    let best = 1e12;
    for (const [a, b] of segments) {
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - a[0]) * dx + (z - a[1]) * dz) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = a[0] + dx * t - x;
      const ez = a[1] + dz * t - z;
      const d2 = ex * ex + ez * ez;
      if (d2 < best) best = d2;
    }
    let dist = Math.sqrt(best);
    for (const ring of ctx.rings) dist = Math.min(dist, Math.abs(Math.hypot(x - ring.x, z - ring.z) - ring.r));
    return dist;
  }
  // Sharp-ish route corners (|curv| > 0.04): objects must stay `margin` away from them.
  const corners = [];
  for (let i = 0; i < ctx.route.n; i += 3)
    if (Math.abs(ctx.route.curv[i]) > 0.04) corners.push([ctx.route.x[i], ctx.route.z[i]]);
  /** Is the 3x3 grid of probe points around (x,z) (steps hw,hd) inside the rug and clear of roads/corners? */
  function isClear(x, z, hw, hd, cornerMargin = 15) {
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const [wx, wz] = ctx.warp(x + i * hw, z + j * hd);
        if (
          Math.abs(wx) > ctx.hx - 2 ||
          Math.abs(wz) > ctx.hz - 2 ||
          (ctx.inside && !ctx.inside(wx, wz, 3)) || // shaped rugs: keep everything on the cloth
          distToRoad(wx, wz) < ctx.road / 2 + 1.6 ||
          corners.some(([cx, cz]) => (cx - wx) ** 2 + (cz - wz) ** 2 < cornerMargin * cornerMargin)
        )
          return false;
      }
    return true;
  }

  const layout = {
    houses: [], ponds: [], fields: [], parking: [], farm: [], fences: [], trees: [], towers: [], ducks: [], reeds: [], paths: [],
  };
  let buildingCounter = 0;
  /** Does a building of half extents (hw,hd) at (x,z) (pre-warp coords) overlap an existing one? */
  const overlapsHouse = (x, z, hw, hd, margin = 2) => {
    const [wx, wz] = ctx.warp(x, z);
    return layout.houses.some((h) => {
      const hhw = (h.w ?? h.r * 2) / 2;
      const hhd = (h.d ?? h.r * 2) / 2;
      return Math.abs(wx - h.wx) < hw + hhw + margin && Math.abs(wz - h.wz) < hd + hhd + margin;
    });
  };
  function addBuilding(kind, x, z, props, margin = 2) {
    const hw = (props.w ?? props.r * 2) / 2;
    const hd = (props.d ?? props.r * 2) / 2;
    if (overlapsHouse(x, z, hw, hd, margin)) return false;
    const [wx, wz] = ctx.warp(x, z);
    layout.houses.push({
      ready: true, kind, x, z, y: z, wx, wz, rot: 0, seed: 7e3 + buildingCounter++ * 53, art: 1.5, ...props,
    });
    return true;
  }
  const randomPalette = () => HOUSE_PALETTES[Math.floor(rand() * HOUSE_PALETTES.length)];
  function addHouse(x, z, tall = false, margin = 2) {
    const pal = randomPalette();
    return addBuilding(
      "house", x, z,
      { w: 14, d: 11, h: tall ? 12.5 : 7.2, roofH: tall ? 4.8 : 4.6, chimney: true, wall: pal.wall, roof: pal.roof },
      margin,
    );
  }
  /** Is (x,z) with half extents clear of ponds, fields, parking and farm plots? */
  function isFreeOfLakesAndFields(x, z, hw, hd) {
    for (const p of layout.ponds)
      if (((x - p.x) / (p.rx + hw + 2)) ** 2 + ((z - p.z) / (p.rz + hd + 2)) ** 2 < 1) return false;
    for (const f of [
      ...layout.fields.map((q) => ({ ...q, h: q.d })),
      ...layout.parking.map((q) => ({ ...q, h: q.d })),
      ...layout.farm.map((q) => ({ ...q, z: q.y })),
    ])
      if (Math.abs(x - f.x) < f.w / 2 + hw + 2 && Math.abs(z - f.z) < f.h / 2 + hd + 2) return false;
    return true;
  }
  /** Grid-fill a zone (3 unit steps, 8 margin) with houses wherever clear; 25% are tall. */
  function fillWithHouses(zone, margin) {
    for (let z = zone.z0 - 8; z <= zone.z1 + 8; z += 3)
      for (let x = zone.x0 - 8; x <= zone.x1 + 8; x += 3)
        overlapsHouse(x, z, 7, 7.5, margin) ||
          !isFreeOfLakesAndFields(x, z, 7, 7.5) ||
          !isClear(x, z, 7, 7.5) ||
          addHouse(x, z, rand() < 0.25, margin);
  }
  function addPond(x, z, rx, rz, island) {
    layout.ponds.push({ x, z, rx, rz, seed: rand() * 6 + 1, island });
    layout.ducks.push({ x: x + rx * 0.45, z: z + rz * 0.35 });
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2;
      layout.reeds.push({ x: x + Math.cos(a) * (rx - 0.5), z: z + Math.sin(a) * (rz - 0.5), h: 2 + rand() * 2.4 });
    }
  }
  /** Path polyline of 29 points: offset(t) is relative to (x,z). */
  function addPath(x, z, offset) {
    const pts = [];
    for (let i = 0; i <= 28; i++) pts.push(offset(i / 28));
    layout.paths.push({ x, z, pts });
  }
  const addEllipsePath = (x, z, rx, rz, t0 = 0.15, t1 = 0.95) =>
    addPath(x, z, (t) => {
      const a = (t0 + (t1 - t0) * t) * Math.PI * 2;
      return [Math.cos(a) * rx, Math.sin(a) * rz];
    });

  const kinds = createZoneKinds({
    layout, addBuilding, fillWithHouses, addPond, addPath, addEllipsePath, randomPalette, palettes: HOUSE_PALETTES,
  });
  for (const [id, kind] of Object.entries(arrange)) {
    const z = zones[id];
    kinds[kind]({ ...z, w: z.x1 - z.x0, d: z.z1 - z.z0, cx: (z.x0 + z.x1) / 2, cz: (z.z0 + z.z1) / 2 });
  }
  // Houses in remaining zones (not football/farm/town, which handled themselves).
  for (const [id, kind] of Object.entries(arrange))
    kind !== "football" && kind !== "farm" && kind !== "town" && fillWithHouses(zones[id], 9);

  // Ponds in the gaps: at most 2 in total, first position that fits.
  let pondCount = 0;
  for (const gap of gaps) {
    const horizontal = gap.x1 - gap.x0 > gap.z1 - gap.z0;
    const rx = horizontal ? 10 : 5.5;
    const rz = horizontal ? 5.5 : 10;
    for (const f of [0.28 + rand() * 0.1, 0.7, 0.5]) {
      if (pondCount >= 2) break;
      const x = horizontal ? gap.x0 + (gap.x1 - gap.x0) * f : (gap.x0 + gap.x1) / 2;
      const z = horizontal ? (gap.z0 + gap.z1) / 2 : gap.z0 + (gap.z1 - gap.z0) * f;
      if (!(overlapsHouse(x, z, rx + 2, rz + 2) || !isFreeOfLakesAndFields(x, z, rx + 2, rz + 2) || !isClear(x, z, rx + 2.5, rz + 2.5))) {
        addPond(x, z, rx, rz);
        pondCount++;
        break;
      }
    }
  }
  for (const gap of gaps) fillWithHouses(gap, 5);

  // ---- trees ----
  const isTreeSpotFree = (x, z, r) => {
    if (overlapsHouse(x, z, r, r, 1.5)) return false;
    for (const p of layout.ponds)
      if (((x - p.x) / (p.rx + r + 2)) ** 2 + ((z - p.z) / (p.rz + r + 2)) ** 2 < 1) return false;
    for (const f of [
      ...layout.fields.map((q) => ({ ...q, h: q.d })),
      ...layout.parking.map((q) => ({ ...q, h: q.d })),
      ...layout.farm.map((q) => ({ ...q, z: q.y })),
    ])
      if (Math.abs(x - f.x) < f.w / 2 + r + 1.5 && Math.abs(z - f.z) < f.h / 2 + r + 1.5) return false;
    return !layout.trees.some((t) => Math.hypot(x - t.x, z - t.z) < t.r + r + 0.8);
  };
  const onPath = (x, z, r) =>
    layout.paths.some((p) => p.pts.some(([px, pz]) => Math.hypot(p.x + px - x, p.z + pz - z) < r + 1.6));
  const tryAddTree = (x, z, r) =>
    !isTreeSpotFree(x, z, r) || onPath(x, z, r) || !isClear(x, z, r, r, 8)
      ? false
      : (layout.trees.push({
          x, z, r,
          h: r * (2.4 + rand() * 0.7),
          kind: rand() < 0.3 ? "pine" : "round",
          shade: rand(),
        }),
        true);
  // Up to 12 trees per zone (28 in parks), 300 attempts each.
  for (const id of Object.keys(arrange)) {
    const zone = zones[id];
    const quota = arrange[id] === "park" ? 28 : 12;
    let placed = 0;
    for (let attempt = 0; attempt < 300 && placed < quota; attempt++) {
      const r = 2.6 + rand() * 2;
      tryAddTree(
        zone.x0 + r + rand() * (zone.x1 - zone.x0 - 2 * r),
        zone.z0 + r + rand() * (zone.z1 - zone.z0 - 2 * r),
        r,
      ) && placed++;
    }
  }
  // Fill the rest of the rug from a shuffled 10-unit grid until 125 trees exist.
  const grid = [];
  for (let z = -ctx.hz + 8; z < ctx.hz - 7; z += 10)
    for (let x = -ctx.hx + 8; x < ctx.hx - 7; x += 10) grid.push([x, z]);
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  for (const [x, z] of grid) {
    if (layout.trees.length >= 125) break;
    tryAddTree(x + (rand() - 0.5) * 7, z + (rand() - 0.5) * 7, 2.6 + rand() * 2);
  }
  // Shaped rugs only (ctx.inside): a second pass of smaller trees on a finer grid, so the narrow margins
  // between the road and the rug edge still read as scenery. Uses this map's own seeded stream.
  if (ctx.inside) {
    const fine = [];
    for (let z = -ctx.hz + 6; z < ctx.hz - 5; z += 6)
      for (let x = -ctx.hx + 6; x < ctx.hx - 5; x += 6) fine.push([x, z]);
    for (let i = fine.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [fine[i], fine[j]] = [fine[j], fine[i]];
    }
    const cap = layout.trees.length + (ctx.extraTrees ?? 60);
    for (const [x, z] of fine) {
      if (layout.trees.length >= cap) break;
      tryAddTree(x + (rand() - 0.5) * 4, z + (rand() - 0.5) * 4, 1.7 + rand() * 1.1);
    }
  }

  // ---- radio towers: up to 4, >= 60 apart, in zone corners; clears nearby trees ----
  const ids = Object.keys(arrange);
  for (let i = 0; i < ids.length * 2 && layout.towers.length < 4; i++) {
    const zone = zones[ids[i % ids.length]];
    const x = i % 2 ? zone.x0 + 8 : zone.x1 - 8;
    const z = i < ids.length ? zone.z1 - 6 : zone.z0 + 5;
    if (!(!isTreeSpotFree(x, z, 7) || !isClear(x, z, 7, 4.5) || layout.towers.some((t) => Math.hypot(t.x - x, t.z - z) < 60))) {
      layout.towers.push({ x, z, n: 3 + (i % 3), color: ACCENT_COLORS[layout.towers.length] });
      for (let k = layout.trees.length - 1; k >= 0; k--)
        Math.hypot(layout.trees[k].x - x, layout.trees[k].z - z) < layout.trees[k].r + 8 && layout.trees.splice(k, 1);
    }
  }
  return layout;
}
