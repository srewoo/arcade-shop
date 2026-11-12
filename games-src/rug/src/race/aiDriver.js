/**
 * AI opponent controller and the obstacle model it uses (original: lm, kw, cm, hm, Gw, um).
 * The AI writes into car.input (throttle/brake/steer/boost/jump) and the normal Car.step integrates it,
 * so AI cars obey the same physics as the player (but with `top` capped by car.topOverride).
 */
import { clamp, angleDelta } from "../util/math.js";
import { PHYSICS } from "../config/physics.js";
import { route, sofaLegs } from "../world/layoutSelect.js";
import { legoBricks } from "../world/trackSamples.js";
import { buildStaticColliders, PROP_HEIGHT_INFINITE } from "./colliders.js";
import { AI_PROFILES, AI_FINISHED_PROFILE, AI_DRIVING as K } from "../config/ai.js";

export { AI_PROFILES, AI_FINISHED_PROFILE };

/**
 * Describe an obstacle in track coordinates:
 *  s = nearest route sample, lat = signed lateral offset from the centreline,
 *  half = lateral half-extent + 3.2 margin, back = longitudinal half-extent + 2.5 margin.
 * @param {{x:number,z:number,r?:number,hx?:number,hz?:number,brick?:boolean}} o
 */
export function describeObstacleOnRoute(o) {
  const s = route.nearestGlobal(o.x, o.z);
  const lat = -(o.x - route.x[s]) * route.tz[s] + (o.z - route.z[s]) * route.tx[s];
  const half = o.r ?? Math.abs(route.tz[s]) * o.hx + Math.abs(route.tx[s]) * o.hz;
  const back = o.r ?? Math.abs(route.tx[s]) * o.hx + Math.abs(route.tz[s]) * o.hz;
  return { s, lat, half: half + 3.2, back: back + 2.5, brick: !!o.brick };
}

// Unjumpable static colliders reduced to plain shapes.
const solidShapes = buildStaticColliders()
  .filter((c) => c.h >= PROP_HEIGHT_INFINITE)
  .map((c) => (c.type === "circle" ? { x: c.x, z: c.z, r: c.r } : { x: c.x, z: c.z, hx: c.hx, hz: c.hz }));

/** Obstacles within 8.5 units of the road edge: lego bricks, sofa legs (r*0.85) and solids. */
export const routeObstacles = [
  ...legoBricks.map((b) => ({ x: b.x, z: b.y, hx: b.sx / 2, hz: b.sy / 2, brick: true })),
  ...sofaLegs.map((leg) => ({ x: leg.x, z: leg.z, r: leg.r * 0.85 })),
  ...solidShapes,
]
  .map(describeObstacleOnRoute)
  .filter((o) => Math.abs(o.lat) - (o.half - 3.2) < 8.5);

/** Per-frame AI driving.
 * @param car   the AI car
 * @param cars  all cars (for overtaking)
 * @param opts  {dt, top, aLat, jumpBricks, boost, lane?, rubber?}  (rubber: rubber-band strength, default 1)
 * @param playerProg player's route progress (rubber banding)
 */
export function driveAi(car, cars, opts, playerProg) {
  const speed = Math.max(0, car.speed);
  const lookahead = K.lookaheadBase + speed * K.lookaheadPerSpeed; // route samples ahead to steer toward
  const laneNow = opts.lane ?? car.laneT;
  let targetLane = laneNow;
  const progMod = route.mod(car.prog);
  let nearestAhead = 1e9; // distance (samples) to nearest blocking obstacle
  let laneMin = -K.laneLimit; // allowed lateral window
  let laneMax = K.laneLimit;
  car.input.jump = false;
  for (const o of routeObstacles) {
    let ahead = o.s - progMod;
    if (ahead < -route.len / 2) ahead += route.len; // wrap
    if (ahead > -o.back && ahead < 55 && ahead < nearestAhead && Math.abs(laneNow - o.lat) < o.half) {
      nearestAhead = ahead;
      const leftEdge = o.lat - o.half;
      const rightEdge = o.lat + o.half;
      laneMin = -K.laneLimit;
      laneMax = K.laneLimit;
      // dodge around the nearer edge of the obstacle
      if (Math.abs(leftEdge) < Math.abs(rightEdge)) {
        targetLane = leftEdge;
        laneMax = leftEdge;
      } else {
        targetLane = rightEdge;
        laneMin = rightEdge;
      }
    }
    const brickStart = o.back - 2.5;
    if (
      opts.jumpBricks &&
      o.brick &&
      car.onGround &&
      speed > 14 &&
      ahead > brickStart &&
      ahead < brickStart + 3.2 + speed * 0.32 &&
      Math.abs(car.lat - o.lat) < o.half - 1.2
    ) {
      car.input.jump = true; // hop over lego bricks
    }
  }
  // avoid slower cars just ahead (within 11 samples) by shifting 3.1 sideways
  for (const other of cars) {
    if (other === car) continue;
    const gap = other.prog - car.prog;
    if (gap > 0 && gap < 11 && Math.abs(other.lat - targetLane) < 2.6 && other.speed < speed + 1) {
      targetLane += targetLane >= other.lat ? 3.1 : -3.1;
    }
  }
  targetLane = clamp(targetLane, laneMin, Math.max(laneMin, laneMax));
  car.lane += (targetLane - car.lane) * Math.min(1, K.laneFollow * opts.dt);

  // steering toward a point `lookahead` samples ahead on the chosen lane
  const aim = route.at(car.prog + lookahead, car.lane);
  const headingError = angleDelta(car.a, Math.atan2(aim.z - car.z, aim.x - car.x));
  car.input.steer = clamp(headingError * K.steerGain, -1, 1);

  // corner speed limit v = sqrt(aLat / curvature), plus rubber band toward the player's progress
  const curvature = route.maxCurvAhead(car.prog, 14 + speed * 0.9);
  const cornerSpeed = Math.sqrt(opts.aLat / Math.max(0.004, curvature));
  const rk = opts.rubber ?? 1; // difficulty scales strength and limits (exactly 1 = original)
  const rubber = clamp((playerProg - car.prog) * K.rubberGain * rk, K.rubberMin * rk, K.rubberMax * rk);
  const targetSpeed = Math.min(opts.top * (1 + rubber), cornerSpeed);
  car.topOverride = Math.min(targetSpeed, opts.top * K.topOverrideScale);
  car.input.throttle = speed < targetSpeed ? 1 : K.coastThrottle;
  car.input.brake = speed > targetSpeed + K.brakeMargin ? K.brakeAmount : 0;

  // boost on straights: needs a clear road ahead (>45) and low upcoming curvature; hysteresis at 0.04/0.5
  const boostOk =
    opts.boost &&
    car.onGround &&
    nearestAhead > 45 &&
    route.maxCurvAhead(car.prog, 20 + speed) < opts.aLat / (PHYSICS.aiBoostTop * PHYSICS.aiBoostTop);
  if (!boostOk || car.boost < 0.04) car.aiBoost = false;
  else if (car.boost > 0.5 && speed > 20) car.aiBoost = true;
  car.input.boost = !!car.aiBoost;
  if (car.aiBoost) {
    car.input.throttle = 1;
    car.input.brake = 0;
  }

  // stuck detection: no new best progress for 1.4 s while it wants > 8 u/s -> teleport 8 samples ahead
  if (car.prog > car.bestProg) {
    car.bestProg = car.prog;
    car.stuckT = 0;
  } else if (targetSpeed > 8) {
    car.stuckT += opts.dt;
  }
  if (car.stuckT > K.stuckSeconds) {
    car.prog = Math.round(car.bestProg) + K.stuckSkip;
    car.bestProg = car.prog;
    const p = route.at(car.prog, 0);
    Object.assign(car, {
      x: p.x,
      z: p.z,
      a: p.heading,
      vx: p.tx * 8,
      vz: p.tz * 8,
      spin: 0,
      stuckT: 0,
      lane: 0,
      y: 0,
      vy: 0,
      onGround: true,
    });
    // RE: original assigns the raw nearestGlobal() result to idx (a sample index, not {i,s,lat})
    car.idx = route.nearestGlobal(car.x, car.z);
  }
}
