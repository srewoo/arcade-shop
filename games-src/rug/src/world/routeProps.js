// Per-route props placed along the centreline: brick piles, cat crossings, sofa legs.
import { ACCENT_COLORS } from "./layoutGenerator.js";

/**
 * @param route  route object (see route.js)
 * @param houses array of placed buildings (used to keep sofa legs clear of them)
 * @returns {{bricks, cats, sofaLegs, SOFA_BOTTOM}}
 */
export function placeRouteProps(route, houses) {
  const straight = (s) => route.maxCurvAhead(s - 28, 58) < 0.022;
  const gentle = (s) => route.maxCurvAhead(s - 14, 30) < 0.03;
  // used[] = route positions already claimed (start line at 0 and the grid at -16)
  const used = [0, route.mod(-16)];
  const farFromUsed = (s, minGap) =>
    used.every((p) => {
      const d = Math.abs(route.mod(s) - p);
      return Math.min(d, route.len - d) >= minGap;
    });
  // Find the next suitable position at or after s: first prefer straights, then gentle stretches.
  const findSpot = (s, minGap = 45) => {
    for (const test of [straight, gentle])
      for (let k = 0; k < route.len; k += 3)
        if (test(s + k) && farFromUsed(s + k, test === straight ? minGap : minGap * 0.7)) {
          used.push(route.mod(s + k));
          return route.mod(s + k);
        }
    return null;
  };

  const bricks = [];
  for (let i = 0; i < 7; i++) {
    const s = findSpot(40 + (i * route.len) / 7);
    if (s === null) continue;
    const p = route.at(s, i % 2 ? 3.6 : -3.6);
    const alongX = Math.abs(p.tx) > Math.abs(p.tz);
    bricks.push({
      x: p.x,
      z: p.z,
      w: alongX ? 10 : 6.5,
      d: alongX ? 6.5 : 10,
      color: ACCENT_COLORS[i % ACCENT_COLORS.length],
    });
  }

  // Cat crossings: position + unit direction (axis aligned) across the road.
  const cats = [0.3, 0.52, 0.72, 0.9].map((f) => {
    const p = route.at(findSpot(f * route.len, 0) ?? f * route.len);
    return Math.abs(p.tx) > Math.abs(p.tz)
      ? { x: p.x, z: p.z, dx: 0, dz: p.tx > 0 ? -1 : 1 }
      : { x: p.x, z: p.z, dx: p.tz > 0 ? 1 : -1, dz: 0 };
  });

  const clearOfHouses = (p) =>
    houses.every(
      (h) => Math.abs(p.x - h.x) > (h.w ?? h.r * 2) / 2 + 9 || Math.abs(p.z - h.z) > (h.d ?? h.r * 2) / 2 + 9,
    );
  // Two sofa legs on straights, lateral 12.5, at least 90 apart.
  const legSpots = [];
  for (let s = 20; s < route.len && legSpots.length < 2; s += 6) {
    if (!straight(s) || !farFromUsed(s, 34)) continue;
    const p = route.at(s, 12.5);
    if (clearOfHouses(p) && (!legSpots.length || Math.hypot(p.x - legSpots[0].x, p.z - legSpots[0].z) > 90))
      legSpots.push(p);
  }
  while (legSpots.length < 2) legSpots.push(route.at(legSpots.length * 200 + 30, 12.5));
  const sofaLegs = legSpots.map((p) => ({ x: p.x, z: p.z, r: 5.4, h: 74 }));
  const [legA, legB] = sofaLegs;
  const SOFA_BOTTOM = {
    x: (legA.x + legB.x) / 2,
    z: (legA.z + legB.z) / 2,
    w: Math.abs(legA.x - legB.x) + 90,
    d: Math.abs(legA.z - legB.z) + 70,
  };
  return { bricks, cats, sofaLegs, SOFA_BOTTOM };
}

/** True when (x,z)-radius `r` object is behind (higher z than) a sofa leg's front edge, within its width. RE: purpose of the test is unclear. */
export function underSofaEdge(leg, x, z, r) {
  return z > leg.z1 - leg.r && Math.abs(x - leg.x) < leg.r + r + 1;
}
