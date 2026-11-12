/**
 * Car collision helpers (original: methods of class Fw plus function Ow).
 *
 * A car is modelled as TWO circles of radius CAR_SIZE.radius centred CAR_SIZE.axle
 * ahead of / behind the car origin (see circles()).  Static scenery is a flat list of
 * colliders built in ./colliders.js:
 *   { type:"circle", x, z, r, h, ball?, prop? }
 *   { type:"obb", x, z, a, hx, hz, h, off?, brick? }   (a = yaw, hx/hz = half extents)
 * `h` is the collider height: a car that is airborne above h (minus 0.4 slack) passes over it
 * and may even land on top (see carGroundHeight).  h = 99 means "never jumpable".
 * `reach` is a cheap broad-phase radius; `off` disables a collider (e.g. picked-up bricks).
 */
import { clamp } from "../util/math.js";
import { CAR_SIZE } from "../config/physics.js";
import { PHYSICS } from "../config/physics.js";
import { RUG, RUG_SHAPE } from "../world/layoutSelect.js";
import { clampToShape } from "../logic/shapeRoutes.js";

/** Centres of the car's two collision circles (front, rear). */
export function carCircles(car) {
  const cos = Math.cos(car.a);
  const sin = Math.sin(car.a);
  return [
    [car.x + cos * CAR_SIZE.axle, car.z + sin * CAR_SIZE.axle],
    [car.x - cos * CAR_SIZE.axle, car.z - sin * CAR_SIZE.axle],
  ];
}

/** True when the collider is too far away on x or z to possibly touch (broad phase). */
function outOfReach(car, c) {
  return c.reach !== undefined && (Math.abs(car.x - c.x) > c.reach + 5 || Math.abs(car.z - c.z) > c.reach + 5);
}

/**
 * Height of the surface under the car: the top of an OBB it is standing on, else 0.
 * Ghost cars (demo / menu) always return 0.
 */
export function carGroundHeight(car, env) {
  if (car.ghost) return 0;
  for (const c of env.colliders) {
    if (c.type !== "obb" || c.off || outOfReach(car, c)) continue;
    const dx = car.x - c.x;
    const dz = car.z - c.z;
    const cos = Math.cos(c.a);
    const sin = Math.sin(c.a);
    const localX = dx * cos + dz * sin;
    const localZ = -dx * sin + dz * cos;
    if (Math.abs(localX) < c.hx + 0.6 && Math.abs(localZ) < c.hz + 0.6 && car.y >= c.h - 0.4) return c.h;
  }
  return 0;
}

/**
 * Push the car out along (nx,nz) by `depth` and reflect its velocity.
 * @param other   collider (may carry vx/vz for moving things, `ball`, `hard`)
 * @param restitution bounce factor (default 0.35)
 * Emits a "hit" event when impact speed > 6 (audio/camera shake use it).
 */
export function applyHit(car, nx, nz, depth, other, restitution = 0.35) {
  car.x += nx * depth;
  car.z += nz * depth;
  const otherVx = other?.vx || 0;
  const otherVz = other?.vz || 0;
  const relVx = car.vx - otherVx;
  const relVz = car.vz - otherVz;
  const closing = relVx * nx + relVz * nz;
  if (closing >= 0) return; // already separating
  const impact = -closing;
  car.vx -= (1 + restitution) * closing * nx;
  car.vz -= (1 + restitution) * closing * nz;
  if (other?.ball) {
    // RE: the football gets kicked: extra 16 u/s shove and a small hop
    car.vx += nx * 16;
    car.vz += nz * 16;
    if (car.onGround) {
      car.vy = 6;
      car.onGround = false;
    }
  }
  if (other?.hard && impact >= 3) {
    // hard obstacles bleed up to 50% of speed (saturating at impact 28) and can spin the car out
    const keep = 1 - 0.5 * clamp(impact / 28, 0, 1);
    car.vx *= keep;
    car.vz *= keep;
    if (impact >= PHYSICS.spinImpact && car.spin <= 0) {
      const t = clamp((impact - PHYSICS.spinImpact) / (34 - PHYSICS.spinImpact), 0, 1);
      car.spin = 0.14 + 0.24 * t; // seconds
      car.spinRate = (car.rnd() < 0.5 ? -1 : 1) * 6; // rad/s
    }
  }
  if (impact > 6 && car.hitCd <= 0) {
    car.events.push({ type: "hit", strength: impact });
    car.hitCd = 0.3;
    car.squashV -= Math.min(4, impact * 0.15);
  }
}

/** Collide both car circles against all static colliders. */
export function collideCarWithColliders(car, env) {
  const radius = CAR_SIZE.radius;
  for (const c of env.colliders) {
    if (c.off || outOfReach(car, c)) continue;
    if (c.type === "circle") {
      if (car.y > c.h) continue;
      for (const [cx, cz] of carCircles(car)) {
        const dx = cx - c.x;
        const dz = cz - c.z;
        const dist = Math.hypot(dx, dz);
        const minDist = radius + c.r;
        if (dist < minDist && dist > 1e-4) applyHit(car, dx / dist, dz / dist, minDist - dist, c, c.ball ? 0.9 : 0.3);
      }
    } else if (c.type === "obb") {
      if (car.y >= c.h - 0.4) continue;
      const cos = Math.cos(c.a);
      const sin = Math.sin(c.a);
      for (const [cx, cz] of carCircles(car)) {
        const dx = cx - c.x;
        const dz = cz - c.z;
        // circle centre in the box's local frame, then nearest point on the box
        const localX = dx * cos + dz * sin;
        const localZ = -dx * sin + dz * cos;
        const nearX = clamp(localX, -c.hx, c.hx);
        const nearZ = clamp(localZ, -c.hz, c.hz);
        let ox = localX - nearX;
        let oz = localZ - nearZ;
        const dist = Math.hypot(ox, oz);
        if (dist >= radius) continue;
        if (dist < 1e-4) {
          // centre is inside the box: push out through the nearest face
          const penX = c.hx - Math.abs(localX);
          const penZ = c.hz - Math.abs(localZ);
          if (penX < penZ) {
            ox = Math.sign(localX) || 1;
            oz = 0;
          } else {
            ox = 0;
            oz = Math.sign(localZ) || 1;
          }
          applyHit(car, ox * cos - oz * sin, ox * sin + oz * cos, radius + Math.min(penX, penZ), c);
          continue;
        }
        const lx = ox / dist;
        const lz = oz / dist;
        applyHit(car, lx * cos - lz * sin, lx * sin + lz * cos, radius - dist, c);
      }
    }
  }
}

/** Keep the car inside the rug (3 units inside the edge); walls absorb 70% of the normal speed. */
export function clampCarToRug(car) {
  const maxX = RUG.W / 2 - 3;
  const maxZ = RUG.H / 2 - 3;
  if (car.x < -maxX) {
    car.x = -maxX;
    if (car.vx < 0) car.vx *= -0.3;
  }
  if (car.x > maxX) {
    car.x = maxX;
    if (car.vx > 0) car.vx *= -0.3;
  }
  if (car.z < -maxZ) {
    car.z = -maxZ;
    if (car.vz < 0) car.vz *= -0.3;
  }
  if (car.z > maxZ) {
    car.z = maxZ;
    if (car.vz > 0) car.vz *= -0.3;
  }
  if (RUG_SHAPE) {
    // shaped rug: also keep the car on the clipped rug (bounce off the rim like the rectangle edges)
    const [x, z, moved] = clampToShape(RUG_SHAPE, car.x, car.z, 3);
    if (moved) {
      const nx = car.x - x;
      const nz = car.z - z;
      const len = Math.hypot(nx, nz) || 1;
      const out = (car.vx * nx + car.vz * nz) / len;
      car.x = x;
      car.z = z;
      if (out > 0) {
        car.vx -= (1.3 * out * nx) / len;
        car.vz -= (1.3 * out * nz) / len;
      }
    }
  }
}

/**
 * Pairwise car-vs-car collision (original: function Ow). Circles of two cars overlap ->
 * separate each by half the overlap and exchange 65% of the closing speed along the normal.
 * Cars that are grabbed (lifted by the "hand" in the intro/outro) or on different heights are skipped.
 */
export function resolveCarCarCollisions(cars) {
  const radius = CAR_SIZE.radius;
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      if (a.grabbed || b.grabbed || Math.abs(a.y - b.y) > 1.6 || Math.abs(a.x - b.x) > 8 || Math.abs(a.z - b.z) > 8) continue;
      const circlesA = carCircles(a);
      const circlesB = carCircles(b);
      for (const [ax, az] of circlesA) {
        for (const [bx, bz] of circlesB) {
          const dx = ax - bx;
          const dz = az - bz;
          const dist = Math.hypot(dx, dz);
          if (dist >= radius * 2 || dist < 1e-4) continue;
          const nx = dx / dist;
          const nz = dz / dist;
          const push = (radius * 2 - dist) / 2;
          a.x += nx * push;
          a.z += nz * push;
          b.x -= nx * push;
          b.z -= nz * push;
          const closing = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
          if (closing < 0) {
            const impulse = -closing * 0.65;
            a.vx += nx * impulse;
            a.vz += nz * impulse;
            b.vx -= nx * impulse;
            b.vz -= nz * impulse;
            if (impulse > 3) {
              if (a.hitCd <= 0) {
                a.events.push({ type: "hit", strength: impulse });
                a.hitCd = 0.3;
              }
              if (b.hitCd <= 0) {
                b.events.push({ type: "hit", strength: impulse });
                b.hitCd = 0.3;
              }
            }
          }
        }
      }
    }
  }
}
