/**
 * Boost pads on the track (original: Wo, Hw; plus unused Bw/sp).
 */
import { PHYSICS } from "../config/physics.js";
import { PAD_COUNTS } from "../logic/settings.js";
import { route, bricks, catCrossings } from "../world/layoutSelect.js";
import { routeObstacles, describeObstacleOnRoute } from "./aiDriver.js";

// RE: original defines these two but never reads them (spare / leftover from an earlier design).
export const unusedBrickZone = describeObstacleOnRoute({ x: bricks[1].x, z: bricks[1].z, hx: 5, hz: 5 });
export const unusedCatCrossingSample = route.nearestGlobal(catCrossings[0].x, catCrossings[0].z);

/** True if sample `s` is within 18 samples of an obstacle that intrudes within 6 units of the road. */
function nearObstacle(s) {
  return routeObstacles.some((o) => {
    const d = Math.abs(o.s - s);
    return Math.min(d, route.len - d) < 18 && Math.abs(o.lat) - (o.half - 3.2) < 6;
  });
}

/**
 * `count` pads, one per 1/count of the lap (starting 45 samples after the line): in each slice pick the
 * straightest stretch (lowest maxCurvAhead(s-10, 28), threshold 0.08), clear of obstacles,
 * alternating lateral offset -2.6 / +2.6.  Pure function of the route (no RNG).
 */
export function buildBoostPads(count) {
  const pads = [];
  for (let i = 0; i < count; i++) {
    let best = null;
    let bestCurv = 0.08;
    for (let k = 0; k < route.len / count; k += 3) {
      const s = route.mod(45 + (i * route.len) / count + k);
      if (s < 45 || s > route.len - 30 || nearObstacle(s)) continue;
      const curv = route.maxCurvAhead(s - 10, 28);
      if (curv < bestCurv) {
        bestCurv = curv;
        best = s;
      }
    }
    if (best === null) continue;
    const p = route.at(best, i % 2 ? 2.6 : -2.6);
    pads.push({ x: p.x, z: p.z, a: p.heading });
  }
  return pads;
}

/** The original five pads per lap (Window.__rug.boostPads). */
export const boostPads = buildBoostPads(PAD_COUNTS.normal);

/** Pad sets by the "boost pad density" setting. */
export const PAD_SETS = { normal: boostPads, more: buildBoostPads(PAD_COUNTS.more) };

/**
 * Per-car pad pickup. `cooldowns[i]` is the remaining re-arm time of pad i (5 s); `pads` defaults to the original five.
 * Adds forward speed up to PHYSICS.boostTop (max +10 for the player, +5 for AI), refills boost.
 */
export function applyBoostPads(car, dt, cooldowns, pads = boostPads) {
  car.padT = Math.max(0, car.padT - dt);
  if (car.y > 4) return;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (cooldowns[i] > 0 || (car.x - pad.x) ** 2 + (car.z - pad.z) ** 2 > 10) continue;
    cooldowns[i] = 5;
    const cos = Math.cos(car.a);
    const sin = Math.sin(car.a);
    const add = Math.max(0, Math.min(car.ai ? 5 : 10, PHYSICS.boostTop - (car.vx * cos + car.vz * sin)));
    car.vx += cos * add;
    car.vz += sin * add;
    car.boost = 1;
    car.padT = 0.8;
    car.events.push({ type: "pad" });
    return;
  }
}
