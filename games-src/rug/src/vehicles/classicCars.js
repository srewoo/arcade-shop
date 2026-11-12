import * as THREE from "three";
import { RoundedBoxGeometry } from "../scene/roundedBoxGeometry.js";
import { makeCarBodyTexture, makeNumberDecalTexture, paintCarBodyTexture } from "../scene/carTextures.js";
import { createCarLights } from "../scene/carLights.js";
import { getClassicMaterials } from "./classicMaterials.js";
import { buildClassicWheel } from "./classicWheel.js";

/** Rounded box with the radius clamped so it never exceeds half the smallest side. */
export function roundedBox(w, h, d, radius, segments = 3) {
  return new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, Math.min(w, h, d) / 2 - 0.001));
}

/** Per-kind paint, stripe colour, race number and display name. */
export const CLASSIC_CAR_SPECS = {
  coupe: { color: "#e5322b", stripe: "#f6f3ea", number: 1, name: "Red Rocket" },
  pickup: { color: "#2f6fd0", stripe: null, number: 7, name: "Blue Bolt" },
  van: { color: "#f2bd1d", stripe: "#2b2b2b", number: 3, name: "Sunny Van" },
  formula: { color: "#1fa45a", stripe: "#f6f3ea", number: 9, name: "Green Flash" },
};

const BODY_PHYSICAL = {
  metalness: 0.45,
  roughness: 0.3,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: 1.25,
};

/**
 * Build a classic die-cast car rig. Axis convention: +X forward, +Z right, Y up.
 * @param {"coupe"|"pickup"|"van"|"formula"} kind
 * @param {number} seed seed for the speckled body texture
 */
export function buildClassicCar(kind, seed = 1) {
  const mats = getClassicMaterials();
  const spec = CLASSIC_CAR_SPECS[kind];
  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: makeCarBodyTexture(spec.color, seed, spec.stripe),
    ...BODY_PHYSICAL,
  });
  const trimMat = new THREE.MeshPhysicalMaterial({ color: spec.color, ...BODY_PHYSICAL });
  const tailMat = mats.tail.clone();
  const root = new THREE.Group();
  const tilt = new THREE.Group();
  const squash = new THREE.Group();
  root.add(tilt);
  tilt.add(squash);
  const cabin = [];
  const addMesh = (geo, mat, x, y, z, parent = squash) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const numberMat = new THREE.MeshStandardMaterial({
    map: makeNumberDecalTexture(spec.number, "#f6f3ea", "#1d1f22"),
    roughness: 0.35,
    transparent: true,
  });
  // wheel radius, width, half track (z), axle offset (x), truck tread, driver eye
  let wheelR = 0.62;
  let wheelW = 0.55;
  let halfTrack = 1.2;
  let axleX = 1.85;
  let truckTread = false;
  let eye = [0.2, 1.75, 0];

  if (kind === "coupe") {
    addMesh(roundedBox(6, 0.95, 2.7, 0.38), bodyMat, 0, 1, 0);
    addMesh(roundedBox(2.2, 0.5, 2.5, 0.24), bodyMat, 1.6, 1.42, 0);
    cabin.push(addMesh(roundedBox(2.7, 0.88, 2.34, 0.36), mats.glass, -0.45, 1.78, 0));
    cabin.push(addMesh(roundedBox(2.2, 0.2, 2.1, 0.1), bodyMat, -0.55, 2.24, 0));
    addMesh(roundedBox(0.5, 0.12, 2.5, 0.05), trimMat, -2.85, 1.85, 0);
    for (const z of [-0.9, 0.9]) addMesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), mats.plastic, -2.75, 1.6, z);
    eye = [0.1, 2.45, 0];
  } else if (kind === "pickup") {
    wheelR = 0.78;
    wheelW = 0.7;
    axleX = 1.95;
    truckTread = true;
    addMesh(roundedBox(6.3, 1.05, 2.8, 0.32), bodyMat, 0, 1.4, 0);
    cabin.push(addMesh(roundedBox(2, 1, 2.45, 0.3), mats.glass, 0.55, 2.4, 0));
    cabin.push(addMesh(roundedBox(1.75, 0.22, 2.3, 0.1), bodyMat, 0.48, 2.94, 0));
    for (const z of [-1.3, 1.3]) addMesh(new THREE.BoxGeometry(2.6, 0.6, 0.18), bodyMat, -1.75, 2.2, z);
    addMesh(new THREE.BoxGeometry(0.18, 0.6, 2.6), bodyMat, -3.05, 2.2, 0);
    addMesh(new THREE.BoxGeometry(2.6, 0.1, 2.4), mats.plastic, -1.75, 1.95, 0);
    addMesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), mats.chrome, -0.55, 2.55, -1.15);
    addMesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), mats.chrome, -0.55, 2.55, 1.15);
    addMesh(new THREE.BoxGeometry(0.16, 0.16, 2.46), mats.chrome, -0.55, 3, 0);
    for (const z of [-0.6, 0, 0.6]) {
      addMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12).rotateZ(Math.PI / 2), mats.head, -0.45, 3, z);
    }
    addMesh(new THREE.BoxGeometry(0.3, 0.45, 2.6), mats.chrome, 3.15, 1.15, 0);
    eye = [1, 3.2, 0];
  } else if (kind === "van") {
    addMesh(roundedBox(6, 2.15, 2.75, 0.45), bodyMat, -0.1, 1.95, 0);
    addMesh(roundedBox(1.2, 1, 2.7, 0.4), bodyMat, 2.6, 1.35, 0);
    cabin.push(addMesh(roundedBox(0.7, 0.95, 2.4, 0.2), mats.glass, 2.12, 2.4, 0));
    for (const z of [-1.39, 1.39]) {
      addMesh(roundedBox(3.6, 0.7, 0.08, 0.03), mats.glass, -0.5, 2.5, z);
      addMesh(roundedBox(5.6, 0.18, 0.06, 0.03), mats.white, -0.1, 1.55, z * 1.002);
    }
    addMesh(new THREE.BoxGeometry(3.4, 0.12, 2), mats.plastic, -0.5, 3.12, 0);
    for (const x of [-2, -0.5, 1]) addMesh(new THREE.BoxGeometry(0.1, 0.18, 2.3), mats.chrome, x, 3.2, 0);
    eye = [1.6, 3, 0];
  } else if (kind === "formula") {
    wheelR = 0.66;
    wheelW = 0.78;
    halfTrack = 1.45;
    axleX = 2;
    addMesh(roundedBox(5.2, 0.62, 1.7, 0.28), bodyMat, -0.2, 0.82, 0);
    // nose cone: squashed cylinder
    addMesh(new THREE.CylinderGeometry(0.28, 0.62, 2, 12).rotateZ(-Math.PI / 2), bodyMat, 3.1, 0.75, 0).scale.set(
      1,
      0.7,
      1,
    );
    addMesh(new THREE.BoxGeometry(0.9, 0.12, 3.4), trimMat, 3.9, 0.45, 0); // front wing
    addMesh(new THREE.BoxGeometry(0.9, 0.14, 3), trimMat, -3, 2, 0); // rear wing
    for (const z of [-0.7, 0.7]) addMesh(new THREE.BoxGeometry(0.2, 1, 0.12), mats.plastic, -3, 1.45, z);
    for (const z of [-1.55, 1.55]) addMesh(new THREE.BoxGeometry(1, 0.7, 0.12), trimMat, -3, 1.75, z);
    for (const z of [-1, 1]) addMesh(roundedBox(2.4, 0.5, 0.6, 0.2), trimMat, -0.6, 0.85, z); // side pods
    cabin.push(addMesh(new THREE.SphereGeometry(0.48, 18, 12), mats.helmet, -0.3, 1.45, 0));
    cabin.push(addMesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), mats.glass, 0.05, 1.45, 0));
    addMesh(roundedBox(1.2, 0.5, 1, 0.2), bodyMat, -1.4, 1.3, 0);
    eye = [0.2, 2.15, 0];
  }

  // lights and bumpers
  const lightX = kind === "formula" ? 0 : kind === "van" ? 3.2 : kind === "pickup" ? 3.16 : 3;
  if (lightX) {
    const lightY = kind === "pickup" ? 1.55 : kind === "van" ? 1.45 : 1.08;
    for (const z of [-0.85, 0.85]) {
      addMesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 16).rotateZ(Math.PI / 2), mats.head, lightX, lightY, z);
      addMesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.12, 14).rotateZ(Math.PI / 2),
        tailMat,
        -lightX + 0.02,
        lightY + 0.05,
        z * 0.95,
      );
    }
    addMesh(roundedBox(0.3, 0.35, 2.75, 0.12), mats.chrome, lightX - 0.05, 0.72, 0);
    addMesh(roundedBox(0.3, 0.35, 2.75, 0.12), mats.chrome, -lightX + 0.05, 0.72, 0);
  } else {
    addMesh(new THREE.BoxGeometry(0.1, 0.16, 0.5), tailMat, -3.45, 1.8, 0);
  }
  // underbody plate (child of tilt, not squash)
  addMesh(
    new THREE.BoxGeometry(kind === "formula" ? 5.4 : 5.6, 0.3, kind === "formula" ? 1.5 : 2.4),
    mats.plastic,
    0,
    0.58,
    0,
    tilt,
  );

  // race-number decals
  if (kind !== "formula") {
    const decalY = kind === "van" ? 2 : kind === "pickup" ? 1.45 : 1.05;
    const decalX = kind === "van" ? -0.6 : kind === "pickup" ? 0.55 : -0.3;
    const decalZ = kind === "van" ? 1.395 : kind === "pickup" ? 1.41 : 1.36;
    for (const side of [-1, 1]) {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), numberMat);
      decal.position.set(decalX, decalY, side * decalZ);
      decal.rotation.y = side < 0 ? Math.PI : 0;
      squash.add(decal);
    }
  } else {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), numberMat);
    decal.position.set(2.5, 1, 0);
    decal.rotation.x = -Math.PI / 2;
    decal.rotation.z = -Math.PI / 2;
    squash.add(decal);
  }

  // wheels: front pair (x = +axleX) first, then rear
  const wheels = [];
  for (const axle of [1, -1]) {
    for (const side of [-1, 1]) {
      const wheel = buildClassicWheel(wheelR, wheelW, mats, truckTread);
      const steer = new THREE.Group();
      steer.position.set(axle * axleX, wheelR, side * halfTrack);
      steer.add(wheel.group);
      tilt.add(steer);
      wheels.push({ steer, spin: wheel.spin, front: axle > 0, r: wheelR });
    }
  }
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const car = {
    root,
    tilt,
    squash,
    wheels,
    cabin,
    eye,
    spec,
    wheelR,
    /** Repaint body texture + trim for a CAR_COLORS entry (skipped if already painted). */
    setColors(scheme) {
      if (car.painted !== scheme.name) {
        car.painted = scheme.name;
        paintCarBodyTexture(bodyMat.map.image, scheme.main, seed, spec.stripe ? scheme.accent : null);
        bodyMat.map.needsUpdate = true;
        trimMat.color.set(scheme.main);
      }
    },
  };
  car.lights = createCarLights(car, tailMat, tailMat.emissiveIntensity);
  return car;
}
