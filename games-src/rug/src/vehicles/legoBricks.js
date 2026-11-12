import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "../scene/roundedBoxGeometry.js";
import { RUG } from "../world/layoutSelect.js";
import { PILE_HEIGHT } from "../world/fiberTextures.js";

/** Horizontal size of one stud cell (xz). */
export const STUD_PITCH = 0.62;
/** Height of a full brick. */
export const BRICK_HEIGHT = 0.76;
/** Height of a plate (1/3 brick in real lego; here 0.25). */
export const PLATE_HEIGHT = 0.25;

let studGeometryCache = null;

/** One stud: lathe of a small rounded-top cylinder profile, non-indexed. */
export function getStudGeometry() {
  if (studGeometryCache) return studGeometryCache;
  const radius = 0.195;
  const height = 0.17;
  const profile = [
    [radius, 0],
    [radius, height - 0.055],
    [radius - 0.004, height - 0.03],
    [radius - 0.02, height - 0.008],
    [radius - 0.05, height],
    [1e-4, height],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  studGeometryCache = new THREE.LatheGeometry(profile, 18).toNonIndexed();
  return studGeometryCache;
}

const brickGeometryCache = new Map();

/**
 * Brick geometry (cached): rounded box of studsX x studsZ cells, `height` tall, with optional studs on top.
 * Origin at the bottom centre.
 */
export function buildBrickGeometry(studsX, studsZ, height, studs = true) {
  const key = `${studsX}|${studsZ}|${height}|${studs}`;
  if (brickGeometryCache.has(key)) return brickGeometryCache.get(key);
  const sizeX = studsX * STUD_PITCH - 0.045;
  const sizeZ = studsZ * STUD_PITCH - 0.045;
  const body = new RoundedBoxGeometry(sizeX, height, sizeZ, 3, 0.075).translate(0, height / 2, 0);
  const parts = [body.index ? body.toNonIndexed() : body];
  if (studs) {
    for (let i = 0; i < studsX; i++) {
      for (let j = 0; j < studsZ; j++) {
        parts.push(
          getStudGeometry()
            .clone()
            .translate((i - (studsX - 1) / 2) * STUD_PITCH, height - 0.02, (j - (studsZ - 1) / 2) * STUD_PITCH),
        );
      }
    }
  }
  const merged = mergeGeometries(parts);
  brickGeometryCache.set(key, merged);
  return merged;
}

// ---- debris: bricks knocked off a lego car ----

/** Active flying/settling bricks (entries created by legoCar.breakOff). */
export const flyingBricks = [];
const UP_AXIS = new THREE.Vector3(0, 1, 0);
const scratchVec3 = new THREE.Vector3();

/** Advance debris physics: gravity 30, bounce 0.42, then settle flat and shrink out over the last 0.5s of life. */
export function updateFlyingBricks(dt) {
  for (let i = flyingBricks.length - 1; i >= 0; i--) {
    const brick = flyingBricks[i];
    const mesh = brick.mesh;
    brick.life -= dt;
    if (brick.life <= 0) {
      mesh.visible = false;
      flyingBricks.splice(i, 1);
      continue;
    }
    if (brick.life < 0.5) mesh.scale.setScalar(Math.max(0.01, brick.life / 0.5));
    if (brick.rest) {
      if (brick.settle < 1) {
        brick.settle = Math.min(1, brick.settle + dt * 7);
        mesh.quaternion.slerpQuaternions(brick.fromQ, brick.flatQ, brick.settle);
        mesh.position.y =
          brick.fromY + (brick.floor + (brick.floor === 0 ? PILE_HEIGHT * 0.7 : 0.02) - brick.fromY) * brick.settle;
      }
      continue;
    }
    brick.vy -= 30 * dt;
    mesh.position.x += brick.vx * dt;
    mesh.position.y += brick.vy * dt;
    mesh.position.z += brick.vz * dt;
    mesh.rotateOnWorldAxis(brick.axis, brick.spin * dt);
    // off the rug the floor drops to -0.8
    brick.floor = Math.abs(mesh.position.x) > RUG.W / 2 || Math.abs(mesh.position.z) > RUG.H / 2 ? -0.8 : 0;
    if (mesh.position.y < brick.floor + 0.3) {
      mesh.position.y = brick.floor + 0.3;
      brick.vy = -brick.vy * 0.42;
      brick.vx *= 0.62;
      brick.vz *= 0.62;
      brick.spin *= 0.55;
      if (Math.abs(brick.vy) < 1.6) {
        brick.rest = true;
        brick.settle = 0;
        brick.fromQ = mesh.quaternion.clone();
        brick.fromY = mesh.position.y;
        scratchVec3.set(1, 0, 0).applyQuaternion(mesh.quaternion);
        // flat orientation: only yaw kept, so the brick lies on a face
        brick.flatQ = new THREE.Quaternion().setFromAxisAngle(UP_AXIS, -Math.atan2(scratchVec3.z, scratchVec3.x));
      }
    }
  }
}
