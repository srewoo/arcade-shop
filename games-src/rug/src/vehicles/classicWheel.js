import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const wheelGeometryCache = new Map();

/**
 * Merged wheel geometry (cached by args): tire with tread blocks, rim discs + rings, hub + 5 spokes.
 * @param {number} radius @param {number} width @param {boolean} truck chunkier tread, fewer blocks
 */
export function buildWheelGeometry(radius, width, truck) {
  const key = `${radius}|${width}|${truck}`;
  if (wheelGeometryCache.has(key)) return wheelGeometryCache.get(key);
  const tireParts = [];
  const tireCore = new THREE.CylinderGeometry(radius, radius, width, 24, 1).rotateX(Math.PI / 2);
  tireParts.push(tireCore.toNonIndexed());
  const treadCount = truck ? 14 : 18;
  for (let i = 0; i < treadCount; i++) {
    const angle = (i / treadCount) * Math.PI * 2;
    const block = new THREE.BoxGeometry(0.12, truck ? 0.16 : 0.08, width * 0.9)
      .rotateZ(angle)
      .translate(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    tireParts.push(block.toNonIndexed());
  }
  const rimRadius = radius * 0.62;
  const rimParts = [];
  const hubParts = [];
  for (const side of [-1, 1]) {
    rimParts.push(
      new THREE.CylinderGeometry(rimRadius, rimRadius, 0.06, 20)
        .rotateX(Math.PI / 2)
        .translate(0, 0, side * (width / 2 + 0.005))
        .toNonIndexed(),
    );
    rimParts.push(
      new THREE.TorusGeometry(rimRadius * 0.95, 0.045, 6, 24)
        .translate(0, 0, side * (width / 2 + 0.04))
        .toNonIndexed(),
    );
    hubParts.push(
      new THREE.CylinderGeometry(rimRadius * 0.28, rimRadius * 0.32, 0.12, 12)
        .rotateX(Math.PI / 2)
        .translate(0, 0, side * (width / 2 + 0.05))
        .toNonIndexed(),
    );
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      hubParts.push(
        new THREE.BoxGeometry(rimRadius * 0.9, 0.09, 0.05)
          .rotateZ(angle)
          .translate(Math.cos(angle) * rimRadius * 0.5, Math.sin(angle) * rimRadius * 0.5, side * (width / 2 + 0.035))
          .toNonIndexed(),
      );
    }
  }
  const result = { tire: mergeGeometries(tireParts), rims: mergeGeometries(rimParts), hubs: mergeGeometries(hubParts) };
  wheelGeometryCache.set(key, result);
  return result;
}

/** One classic wheel: returns {group, spin (inner group rotated by the physics), r}. */
export function buildClassicWheel(radius, width, mats, truck) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);
  const geo = buildWheelGeometry(radius, width, truck);
  spin.add(
    new THREE.Mesh(geo.tire, mats.tire),
    new THREE.Mesh(geo.rims, mats.chrome),
    new THREE.Mesh(geo.hubs, mats.darkChrome),
  );
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return { group, spin, r: radius };
}
