// Chase camera + viewport handling (bundle functions zh = resize, Bh = updateCamera).
import * as THREE from 'three';
import { clamp, damp, lerp } from './util.js';
import { game, focus, settings } from './state.js';
import { renderer, camera, shake } from './systems.js';
import { CAMERA } from './tuning.js';
import { hazardLift } from './cameraMath.js';

const BASE_FOV_MIN = CAMERA.fovMin;
const BASE_FOV_MAX = CAMERA.fovMax;
const camPos = new THREE.Vector3(); // smoothed camera position
const camLook = new THREE.Vector3(); // smoothed look-at
const wantPos = new THREE.Vector3();
const wantLook = new THREE.Vector3();
const shift = new THREE.Vector3();
let baseFov = 55; // fov that keeps a fixed horizontal extent on narrow screens
let fovBoost = 0; // extra fov at high speed (0..7 degrees)
let fovPunch = 0; // one-off extra fov that decays (new best)

/** Look-at shift that parks the dino in the clear part of the screen: lower on tall screens, right of the panel on wide ones. */
export function layoutShift(aspect, kind, out) {
  if (aspect >= 1.3) return out.set(kind.landscapeShiftX * (aspect / 1.6), kind.landscapeLookY, 0); // visible width grows with aspect
  const tall = clamp((1.3 - aspect) / 0.8, 0, 1);
  return out.set(0, kind.portraitLookY * (0.6 + 0.4 * tall), (kind.portraitBack ?? 0) * tall);
}

/** Apply a layoutShift to the wanted camera and look-at: slide sideways, pull back (z), tilt the look-at up (y). */
function applyShift(s) {
  wantPos.x += s.x;
  wantPos.z += s.z;
  wantLook.x += s.x;
  wantLook.y += s.y;
}

/** Briefly widen the field of view (decays over about 2 s; callers skip it under reduced motion). */
export function punchFov(degrees) {
  fovPunch = degrees;
}

export function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Keep horizontal framing of a 21-degree half-angle (vertical) at aspect 1; widen vertical FOV on portrait.
  baseFov = clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(21)) / camera.aspect)), BASE_FOV_MIN, BASE_FOV_MAX);
  camera.fov = baseFov + fovBoost;
  camera.updateProjectionMatrix();
}

/** @param snap true = jump straight to the target pose (used on reset). */
export function updateCamera(dt, snap = false) {
  // narrowness 0 (landscape, aspect >= 1.3) .. 1 (portrait, aspect <= 0.5): pull back and raise on narrow screens
  const narrow = clamp((1.3 - camera.aspect) / 0.8, 0, 1);
  const sideX = lerp(...CAMERA.framing.side, narrow);
  const height = lerp(...CAMERA.framing.height, narrow);
  const back = lerp(...CAMERA.framing.back, narrow);
  const dead = game.state === 'crashed' || game.state === 'gameover';
  if (dead) {
    // orbit to a 3/4 view of the ragdoll
    wantPos.set(focus.x + sideX * 1.1, Math.max(1.9, focus.y * 0.6 + 2.3), focus.z + back * 0.95);
    wantLook.set(focus.x, Math.max(0.7, focus.y), focus.z - 0.8);
    applyShift(layoutShift(camera.aspect, CAMERA.dead, shift));
  } else {
    const lift = game.state === 'title' ? 0 : hazardLift({ mode: game.mode, difficulty: settings.difficulty, classicPlus: settings.classicPlus });
    wantPos.set(sideX, height + lift + focus.y * 0.42, focus.z + back);
    wantLook.set(0, 1.5 + focus.y * 0.55, focus.z - 7);
    if (game.state === 'title') {
      applyShift(layoutShift(camera.aspect, CAMERA.title, shift));
    }
  }
  if (snap) {
    camPos.copy(wantPos);
    camLook.copy(wantLook);
  } else if (dead) {
    camPos.x = damp(camPos.x, wantPos.x, 3.5, dt);
    camPos.y = damp(camPos.y, wantPos.y, 3.5, dt);
    camPos.z = damp(camPos.z, wantPos.z, 5.5, dt);
    camLook.x = damp(camLook.x, wantLook.x, 9, dt);
    camLook.y = damp(camLook.y, wantLook.y, 9, dt);
    camLook.z = damp(camLook.z, wantLook.z, 9, dt);
  } else {
    camPos.x = damp(camPos.x, wantPos.x, 5, dt);
    camPos.y = damp(camPos.y, wantPos.y, 6, dt);
    camPos.z = wantPos.z; // z is locked to the player (no lag)
    camLook.x = damp(camLook.x, wantLook.x, 6, dt);
    camLook.y = damp(camLook.y, wantLook.y, 6, dt);
    camLook.z = wantLook.z;
  }
  camera.position.copy(camPos).add(shake.offset);
  camera.lookAt(camLook);
  camera.rotateZ(shake.roll);
  // speed-based FOV kick, up to +7 degrees at max speed
  const target = game.state === 'running' && !settings.reducedMotion ? CAMERA.speedFovKick * clamp((game.speed - game.speedMin) / (game.speedMax - game.speedMin), 0, 1) : 0;
  fovBoost = snap ? target : damp(fovBoost, target, 2, dt);
  fovPunch = settings.reducedMotion ? 0 : damp(fovPunch, 0, 1.6, dt);
  const fov = baseFov + fovBoost + fovPunch;
  if (Math.abs(fov - camera.fov) > 0.01) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}
