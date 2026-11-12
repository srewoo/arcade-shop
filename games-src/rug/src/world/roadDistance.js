/**
 * Brute-force distance-to-road queries used to keep props (houses, trees, fences) off
 * the road. Original minified names in parentheses.
 */
import { MAP } from "../config/maps.js";
import {
  HALF_H,
  HALF_W,
  LAYOUT,
  ROAD_WIDTH,
  roads,
  roundaboutRadius,
  roundabouts,
} from "./layoutSelect.js";

/** All road segments [[ax, az], [bx, bz]], roundabouts approximated by 48-gons. (Ju) */
export const roadSegments = [];
for (const road of roads) {
  for (let i = 0; i < road.pts.length - 1; i++) roadSegments.push([road.pts[i], road.pts[i + 1]]);
}
for (const ring of roundabouts) {
  for (let i = 0; i < 48; i++) {
    const a0 = (i / 48) * Math.PI * 2;
    const a1 = ((i + 1) / 48) * Math.PI * 2;
    roadSegments.push([
      [ring.x + Math.cos(a0) * roundaboutRadius, ring.y + Math.sin(a0) * roundaboutRadius],
      [ring.x + Math.cos(a1) * roundaboutRadius, ring.y + Math.sin(a1) * roundaboutRadius],
    ]);
  }
}

/** Distance from (x, z) to the nearest road segment. (Fl) */
export function distanceToRoad(x, z) {
  let best = 1e9;
  for (const [a, b] of roadSegments) {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - a[0]) * dx + (z - a[1]) * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = a[0] + dx * t - x;
    const pz = a[1] + dz * t - z;
    const d2 = px * px + pz * pz;
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}

/** Does a box with half extents (halfX, halfZ) at (x, z) fit inside the rug (1 unit margin)? (Qu) */
export const insideRug = (x, z, halfX, halfZ) =>
  Math.abs(x) + halfX < HALF_W - 1 && Math.abs(z) + halfZ < HALF_H - 1;

/** Box inside the rug and its 3x3 sample grid clear of every road? (O0) */
export function clearOfRoads(x, z, halfX, halfZ) {
  if (!insideRug(x, z, halfX, halfZ)) return false;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (distanceToRoad(x + i * halfX, z + j * halfZ) < ROAD_WIDTH / 2 + 0.6) return false;
    }
  }
  return true;
}

/** Towers; on arranged maps only those clear of the road are kept. (k0) */
export const towersFiltered = MAP.arrange
  ? LAYOUT.towers.filter((tower) => clearOfRoads(tower.x, tower.z, 6.4, 3.4))
  : LAYOUT.towers;
