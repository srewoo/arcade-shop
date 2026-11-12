// The cat: a procedural orange tabby built from primitives, with 2-bone IK legs and a 10-segment tail.
// It walks across the rug as a hazard (see obstacles.js: updateCat).
import * as THREE from "three";
import { clamp } from "../util/math.js";
import { applyCarpetPile } from "../world/carpetPile.js";
import { makeCatFurTexture } from "./obstacleTextures.js";

/**
 * Build the cat model (minified `rw`).
 * @param {THREE.Texture} fiberTexture rug fibre texture used by the fuzzy fur materials
 * @returns {{root, body, neck, head, legs, tail}}
 */
export function buildCat(fiberTexture) {
  const fur = applyCarpetPile(new THREE.MeshStandardMaterial({ map: makeCatFurTexture(), roughness: 1 }), fiberTexture, {
    scale: 4,
    fuzz: [0.004, 0.004],
    bump: 0.08,
    sheen: 0.35,
  });
  const furLight = applyCarpetPile(new THREE.MeshStandardMaterial({ color: 16248804, roughness: 1 }), fiberTexture, {
    scale: 4,
    bump: 0.08,
    sheen: 0.35,
  });
  const pink = new THREE.MeshStandardMaterial({ color: 15900840, roughness: 0.6 });
  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: 9094202,
    roughness: 0.05,
    clearcoat: 1,
    emissive: 2771472,
    emissiveIntensity: 0.3,
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 1052688, roughness: 0.1 });
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  // ellipsoid helper: unit sphere, rotated so its axis lies along x
  const sphereGeo = (r = 1, w = 28, h = 18) => new THREE.SphereGeometry(r, w, h).rotateZ(Math.PI / 2);
  const addMesh = (geo, mat, parent, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  // torso (3 stripe-textured blobs + a lighter chest blob)
  addMesh(sphereGeo(), fur, body, 0, 21.5, 0, 17, 7.6, 7.2);
  addMesh(sphereGeo(), fur, body, 9, 22.5, 0, 8.4, 8.2, 7);
  addMesh(sphereGeo(), fur, body, -9.5, 21.8, 0, 8, 8, 7.2);
  addMesh(sphereGeo(), furLight, body, 13, 19.5, 0, 5, 6, 5.2);
  const neck = new THREE.Group();
  neck.position.set(12, 25, 0);
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(7, 5, 0);
  neck.add(head);
  addMesh(sphereGeo(), fur, head, 0, 0, 0, 6.4, 5.8, 6.6);
  addMesh(sphereGeo(), furLight, head, 4.4, -1.8, 0, 2.6, 2.2, 3.4); // muzzle
  addMesh(new THREE.SphereGeometry(0.75, 12, 8), pink, head, 6.6, -0.6, 0, 1, 0.7, 1.2); // nose
  for (const side of [-1, 1]) {
    const ear = addMesh(new THREE.ConeGeometry(2.4, 4.6, 4), fur, head, -0.6, 5.2, side * 3.3);
    ear.rotation.x = side * 0.32;
    const earInner = addMesh(new THREE.ConeGeometry(1.5, 3.4, 4), pink, head, 0.2, 4.9, side * 3.25);
    earInner.rotation.x = side * 0.32;
    const eye = addMesh(new THREE.SphereGeometry(1.3, 16, 12), eyeMat, head, 4.3, 1.2, side * 2.5);
    addMesh(new THREE.SphereGeometry(0.55, 10, 8), pupilMat, eye, 0.95, 0, 0, 0.5, 1.6, 0.6);
    for (let w = -1; w <= 1; w++) {
      const whisker = addMesh(new THREE.CylinderGeometry(0.05, 0.05, 7, 4), furLight, head, 5.2, -1.6 + w * 0.5, side * 3.6);
      whisker.rotation.x = Math.PI / 2;
      whisker.rotation.z = w * 0.15;
      whisker.rotation.y = side * 0.2;
    }
  }
  // legs: front pair (front:true) and rear pair, each upper + knee + lower + paw; phase offsets the gait
  const legs = [];
  const legDefs = [
    { x: 11, z: -4.3, front: true, phase: 0 },
    { x: 11, z: 4.3, front: true, phase: 0.5 },
    { x: -11, z: -4.3, front: false, phase: 0.75 },
    { x: -11, z: 4.3, front: false, phase: 0.25 },
  ];
  for (const def of legDefs) {
    const hip = new THREE.Group();
    hip.position.set(def.x, 19, def.z);
    body.add(hip);
    const upperLen = 10;
    const lowerLen = 9.6;
    const upper = addMesh(new THREE.CylinderGeometry(2, 1.6, upperLen, 14).translate(0, -upperLen / 2, 0), fur, hip, 0, 0, 0);
    const knee = new THREE.Group();
    knee.position.set(0, -upperLen, 0);
    upper.add(knee);
    const lower = addMesh(
      new THREE.CylinderGeometry(1.55, 1.35, lowerLen, 14).translate(0, -lowerLen / 2, 0),
      def.front ? furLight : fur,
      knee,
      0,
      0,
      0,
    );
    const paw = addMesh(new THREE.SphereGeometry(1, 16, 10), furLight, lower, 0.6, -lowerLen, 0, 2.6, 1.3, 2.1);
    legs.push({ ...def, hip, upper, knee, lower, paw, a: upperLen, b: lowerLen, foot: new THREE.Vector3() });
  }
  // tail: chain of 10 nested segments, each a flattened sphere shrinking by 0.08
  const tail = [];
  let parent = body;
  let offset = new THREE.Vector3(-17, 24, 0);
  for (let i = 0; i < 10; i++) {
    const seg = new THREE.Group();
    seg.position.copy(offset);
    parent.add(seg);
    addMesh(new THREE.SphereGeometry(1.6 - i * 0.08, 12, 8), fur, seg, -1.2, 0, 0, 1.6, 1, 1);
    tail.push(seg);
    parent = seg;
    offset = new THREE.Vector3(-2.3, 0, 0);
  }
  return { root, body, neck, head, legs, tail };
}

/**
 * Two-bone IK in the leg's x/y plane (minified `ow`): sets upper/knee rotations so the paw reaches (footX, footY).
 * @param leg one entry of buildCat().legs
 */
export function solveCatLegIK(leg, hipX, hipY, footX, footY) {
  const dx = footX - hipX;
  const dy = footY - hipY;
  let dist = Math.hypot(dx, dy);
  dist = clamp(dist, 1, leg.a + leg.b - 0.05);
  const kneeCos = (leg.a * leg.a + leg.b * leg.b - dist * dist) / (2 * leg.a * leg.b);
  const kneeAngle = Math.PI - Math.acos(clamp(kneeCos, -1, 1));
  const dir = Math.atan2(dx, -dy);
  const hipCos = (leg.a * leg.a + dist * dist - leg.b * leg.b) / (2 * leg.a * dist);
  const hipAngle = Math.acos(clamp(hipCos, -1, 1));
  const sign = leg.front ? 1 : -1;
  leg.upper.rotation.z = dir + hipAngle * sign;
  leg.knee.rotation.z = -kneeAngle * sign;
}
