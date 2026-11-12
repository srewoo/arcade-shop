// Translucent time-trial ghost car, driven by the stored best run (session.tracker.ghostPose).
import * as THREE from "three";
import { buildClassicCar } from "../vehicles/classicCars.js";
import { scene, popup } from "./bootstrap.js";
import { app } from "./state.js";

const pose = { x: 0, z: 0, a: 0, y: 0 };
let ghost = null;

/** Build the ghost model on first use: a coupe whose materials are cloned, tinted and made see-through. */
function ensureGhost() {
  if (ghost) return ghost;
  ghost = buildClassicCar("coupe", 777);
  const tint = new THREE.Color("#8fd6ff");
  ghost.root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    const mats = (Array.isArray(node.material) ? node.material : [node.material]).map((m) => {
      const c = m.clone();
      c.transparent = true;
      c.opacity = 0.34;
      c.depthWrite = false;
      c.color?.lerp(tint, 0.55);
      return c;
    });
    node.material = Array.isArray(node.material) ? mats : mats[0];
  });
  ghost.root.visible = false;
  scene.add(ghost.root);
  return ghost;
}

/** Place (or hide) the ghost for this frame. time = visual clock (for the pop-up wave level). */
export function updateGhost(session, race, time) {
  const tracker = session.tracker;
  const racing = app.mode === "race" || app.mode === "intro" || app.mode === "results";
  const hasGhost = racing && tracker?.ghost && tracker.ghostPose(Math.max(0, race.time), pose);
  if (!hasGhost) {
    if (ghost) ghost.root.visible = false;
    return;
  }
  const model = ensureGhost();
  const level = popup.levelAt(time, pose.x, pose.z);
  model.root.visible = level > 0.004;
  model.root.position.set(pose.x, pose.y, pose.z);
  model.root.rotation.y = -pose.a;
  model.root.scale.set(1, Math.max(0.001, level), 1);
}

/** Hide the ghost (title/menu/garage). */
export function hideGhost() {
  if (ghost) ghost.root.visible = false;
}
