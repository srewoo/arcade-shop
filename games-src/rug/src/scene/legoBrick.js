// Lego-style brick geometry and glossy plastic material used by brick obstacles and towers.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "./roundedBoxGeometry.js";

/** Height of one stud cylinder (minified `jd`). */
export const STUD_HEIGHT = 0.38;

/**
 * Brick body (rounded box, radius 0.14) with a grid of cylindrical studs on top, merged into one geometry.
 * (minified `Qd`)
 * @param {number} sx size along x
 * @param {number} sz size along z (original arg name `t`; maps to box depth)
 * @param {number} height brick height
 * @param {number} studsX studs along x
 * @param {number} studsZ studs along z
 */
export function buildBrickGeometry(sx, sz, height, studsX, studsZ) {
  const body = new RoundedBoxGeometry(sx, height, sz, 2, 0.14).translate(0, height / 2, 0);
  const parts = [body.index ? body.toNonIndexed() : body];
  const cellX = sx / studsX;
  const cellZ = sz / studsZ;
  const studRadius = Math.min(cellX, cellZ) * 0.3;
  for (let i = 0; i < studsX; i++) {
    for (let j = 0; j < studsZ; j++) {
      parts.push(
        new THREE.CylinderGeometry(studRadius, studRadius, STUD_HEIGHT, 16)
          .translate(-sx / 2 + cellX * (i + 0.5), height + STUD_HEIGHT / 2, -sz / 2 + cellZ * (j + 0.5))
          .toNonIndexed(),
      );
    }
  }
  return mergeGeometries(parts);
}

/** Glossy clear-coated plastic (minified `tp`). */
export function legoMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.1,
  });
}
