import * as THREE from "three";
import { RoundedBoxGeometry } from "../scene/roundedBoxGeometry.js";
import { clamp, lerp, easeOutCubic, easeInCubic, easeInOutCubic } from "../util/math.js";

// Timeline (seconds) of the grab animation.
export const HELI_TOTAL_TIME = 2.2; // au: hand is hidden after this
const DROP_END = 0.8; // qc: hand finished descending
const HOLD_END = 1.08; // Yc: fingers fully closed, lift starts

/**
 * RE: a giant "hand from the sky" (palm block, 4 fingers + thumb, arm tube) that
 * descends, curls its fingers (grab) and carries the car away (used when the player
 * is picked up / reset; paired with sfx.grab + sfx.meow). The name "helicopter"
 * is only the file name of the registry; the model is a fleshy hand.
 * (original: Rw)  Returns {root, update(t, pos, groundY)}; update returns the lift height
 * so the caller can raise the car with the hand.
 * @param {THREE.Scene} scene
 */
export function createGrabHand(scene) {
  const skin = new THREE.MeshPhysicalMaterial({
    color: "#e7b08a",
    roughness: 0.55,
    sheen: 0.6,
    sheenColor: new THREE.Color("#ffb59a"),
    sheenRoughness: 0.6,
  });
  const nail = new THREE.MeshPhysicalMaterial({ color: "#f7ddd2", roughness: 0.25, clearcoat: 1 });
  const sleeve = new THREE.MeshStandardMaterial({ color: "#3a5f9c", roughness: 0.9 });
  const root = new THREE.Group();
  root.visible = false;

  const addMesh = (geometry, material, parent, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const palmY = 7.6;
  addMesh(new RoundedBoxGeometry(11, 3.6, 9.4, 4, 1.6).translate(0, 1.8, 0), skin, root, 0, palmY, 0);

  /** Two-segment finger (base + tip) with a nail on the tip. `side` = curl direction. */
  function makeFinger(x, z, side, length, radius) {
    const base = new THREE.Group();
    base.position.set(x, palmY + 0.8, z);
    root.add(base);
    addMesh(new THREE.CapsuleGeometry(radius, length * 0.55, 6, 12).translate(0, -length * 0.3, 0), skin, base);
    const tip = new THREE.Group();
    tip.position.y = -length * 0.6;
    base.add(tip);
    addMesh(new THREE.CapsuleGeometry(radius * 0.92, length * 0.32, 6, 12).translate(0, -length * 0.22, 0), skin, tip);
    addMesh(
      new THREE.SphereGeometry(1, 16, 12).scale(radius * 0.72, length * 0.15, 0.32),
      nail,
      tip,
      0,
      -length * 0.3,
      side * radius * 0.74,
    );
    return { base, tip, side };
  }

  const fingers = [-3.9, -1.3, 1.3, 3.9].map((x, i) => makeFinger(x, 4.4, 1, [6.9, 8.2, 8.5, 7.8][i], 1.12));
  fingers.push(makeFinger(1, -4.6, -1, 7.6, 1.45)); // thumb

  // forearm + sleeve
  const arm = new THREE.Group();
  arm.position.set(0, palmY + 3, 0);
  arm.rotation.set(0.14, 0, -0.34);
  root.add(arm);
  addMesh(new THREE.CapsuleGeometry(4.3, 7, 6, 18).translate(0, 4, 0), skin, arm);
  addMesh(new THREE.CylinderGeometry(7.2, 5.6, 130, 22).translate(0, 75, 0), sleeve, arm);
  addMesh(new THREE.CylinderGeometry(5.9, 5.9, 2.2, 22).translate(0, 10.2, 0), sleeve, arm);
  scene.add(root);

  /** curl 0 = open, 1 = closed */
  function curlFingers(curl) {
    for (const f of fingers) {
      f.base.rotation.x = f.side * lerp(-1, 0.3, curl);
      f.tip.rotation.x = f.side * lerp(0.1, 0.28, curl);
    }
  }

  return {
    root,
    update(t, pos, groundY) {
      root.visible = t < HELI_TOTAL_TIME;
      if (!root.visible) return 0;
      const drop = 70 * (1 - easeOutCubic(clamp(t / DROP_END, 0, 1)));
      curlFingers(easeInOutCubic(clamp((t - DROP_END) / (HOLD_END - DROP_END), 0, 1)));
      const lift = 95 * easeInCubic(clamp((t - HOLD_END) / (HELI_TOTAL_TIME - HOLD_END), 0, 1));
      root.position.set(pos.x, groundY + drop + lift, pos.z);
      root.rotation.y = -pos.a;
      return lift;
    },
  };
}
