// Per-frame scene synchronisation: car models, tyre trails, particles, sounds, DOF, shadows, HUD.
import * as THREE from "three";
import { clamp, smoothstep } from "../util/math.js";
import { ball } from "../world/layoutSelect.js";
import { sfx } from "../audio/sfx.js";
import {
  world, scene, camera, composer, ui, cameraRig, popup, aoField, particles, popupItems,
  obstacles, sceneryProps, boostPadsView, trailField, rugUniforms, mapPreviewRoute,
} from "./bootstrap.js";
import { app, globalTime } from "./state.js";
import { layout } from "./layout.js";
import { carModels } from "./garage.js";
import { stage } from "./stage.js";
import { updateFlyingBricks } from "../vehicles/legoBricks.js";
import { updateGhost } from "./ghostView.js";
import { updateDriftFx } from "./driftFx.js";
import { applyBlend, restorePoses } from "./interpolation.js";
import { CAMERA_FX } from "../config/camera.js";
import { HUD_TUNING } from "../config/hud.js";

/** Wheel contact offsets [forward, side] x 4 wheels (flat to avoid per-frame arrays). Original `vb`. */
const WHEEL_OFFSETS = [1.85, 1.3, 1.85, -1.3, -1.85, 1.3, -1.85, -1.3];
const wheelScratch = new Float64Array(8);
/** Cheap visual-only random source (particle branches); never used by the simulation. */
let fxState = 0x9e3779b9;
const fxRand = () => {
  fxState ^= fxState << 13;
  fxState ^= fxState >>> 17;
  fxState ^= fxState << 5;
  return (fxState >>> 0) / 4294967296;
};
const tmpVec3A = new THREE.Vector3();
const tmpVec3B = new THREE.Vector3();
let frameCounter = 0;

/** Visual clock: demo time in demo mode, otherwise the global clock. Original `Cb`. */
export const currentVisualTime = () => (app.mode === "demo" ? app.demo.time : globalTime);
const isPlayerVisible = (car) => popup.levelAt(currentVisualTime(), car.x, car.z) > 0.5;

/** Tyre tracks and slide fibres for one car (wheel positions live in a reused buffer, no per-frame arrays). */
function layTyreTracks(car, cos, sin, sliding) {
  for (let w = 0; w < 4; w++) {
    const fwd = WHEEL_OFFSETS[w * 2];
    const side = WHEEL_OFFSETS[w * 2 + 1];
    wheelScratch[w * 2] = car.x + cos * fwd - sin * side;
    wheelScratch[w * 2 + 1] = car.z + sin * fwd + cos * side;
  }
  if (car.trail) {
    for (let w = 0; w < 4; w++) {
      const px = car.trail[w * 2];
      const pz = car.trail[w * 2 + 1];
      const dist = Math.hypot(wheelScratch[w * 2] - px, wheelScratch[w * 2 + 1] - pz);
      if (dist > 0.03 && dist < 4) {
        trailField.add(px, pz, wheelScratch[w * 2], wheelScratch[w * 2 + 1], sliding ? 0.85 : 0.66, sliding ? 0.1 : 0.3, sliding ? 0.75 : 0.6);
      }
    }
  }
  car.trail = car.trail ?? new Float64Array(8);
  car.trail.set(wheelScratch);
  if (sliding && fxRand() < 0.7) particles.fibers(car.x - cos * 1.8, car.z - sin * 1.8, car.vx, car.vz, 2, 2);
}

/** Sync one car's model, tyre tracks, particles and event sounds. Original: body of the cars.forEach in `Ab`. */
function syncCar(car, index, dt, time, session, race) {
  const model = carModels[index];
  const level = session.menu
    ? app.mode === "maps" ? 0 : 1
    : car.isPlayer && (app.mode === "garage" || cameraRig.mode === "garage")
      ? 1
      : popup.levelAt(time, car.x, car.z);
  model.root.visible = level > 0.004 && !(car.isPlayer && app.carTaken);
  model.root.position.set(car.x, car.y, car.z);
  model.root.rotation.y = -car.a;
  model.root.scale.set(1, Math.max(0.001, level), 1);
  model.lights.update(dt, car, level);
  if (level > 0.5 && car.onGround && !car.grabbed && model.root.visible) {
    const cos = Math.cos(car.a);
    const sin = Math.sin(car.a);
    const sliding = Math.abs(car.latV) > 5;
    layTyreTracks(car, cos, sin, sliding);
  } else car.trail = null; // not on the ground: no tyre track, next contact starts a new one
  model.tilt.rotation.z = car.pitch;
  model.tilt.rotation.x = car.roll;
  const squash = clamp(car.squash, -0.32, 0.3);
  model.squash.scale.set(1 - squash * 0.45, 1 + squash, 1 - squash * 0.45);
  for (const wheel of model.wheels) {
    wheel.spin.rotation.z = -car.wheelRot;
    if (wheel.front) wheel.steer.rotation.y = -car.steer * 0.45;
  }
  const hideCabin = app.cockpit && car.isPlayer;
  for (const part of model.cabin) part.visible = !hideCabin;
  car.eye = model.eye;
  aoField.add(car.x, car.z, 7.6, 3.9, -car.a, false, level * 0.9 * (1 - clamp(car.y / 4, 0, 0.8)));
  handleCarEvents(car, model, time, race);
  car.events.length = 0;
  if (car.onGround && car.boosting && fxRand() < 0.9) {
    particles.fibers(car.x - Math.cos(car.a) * 3, car.z - Math.sin(car.a) * 3, car.vx, car.vz, 2, 3);
  } else if (car.onGround && car.offroad > 0.5 && Math.abs(car.speed) > 6 && fxRand() < 0.5) {
    particles.fibers(car.x - Math.cos(car.a) * 3, car.z - Math.sin(car.a) * 3, car.vx, car.vz, 1, 2);
  }
}

/** Physics events (land/jump/hit/boost/pad) -> puffs, camera shake, sounds, lego brick break-off. */
function handleCarEvents(car, model, time, race) {
  for (const event of car.events) {
    if (event.type === "land") {
      particles.puff(car.x, car.z, clamp(event.impact / 12, 0.4, 1.3));
      if (car.isPlayer) cameraRig.addShake(CAMERA_FX.landShake);
    }
    if (event.type === "jump") particles.puff(car.x, car.z, 0.3);
    // loudness falls off with distance from the player (full for the player)
    const volume = car.isPlayer ? 1 : Math.max(0, 1 - Math.hypot(car.x - race.player.x, car.z - race.player.z) / 70);
    if (event.type === "hit") {
      sfx.hit(event.strength, volume);
      if (model.lego && time >= (car.nextBreak ?? 0)) {
        // RE: number of bricks knocked off grows with impact strength (<13 none, <20 40% chance of 1, <30 one, else two)
        const bricks = event.strength < 13 ? 0 : event.strength < 20 ? (Math.random() < 0.4 ? 1 : 0) : event.strength < 30 ? 1 : 2;
        if (bricks) {
          model.breakOff(bricks, scene, car.vx, car.vz);
          sfx.bricks(bricks, volume);
          car.nextBreak = time + HUD_TUNING.brickBreakCooldown;
        }
      }
    }
    if (event.type === "jump") sfx.jump(volume);
    if (event.type === "land") sfx.land(volume);
    if (event.type === "boost" && car.isPlayer) sfx.boost();
    if (event.type === "turbo" && car.isPlayer) {
      particles.puff(car.x, car.z, 0.5 + event.tier * 0.2);
      sfx.turbo(event.tier);
      cameraRig.addShake(CAMERA_FX.turboShakePerTier * event.tier);
    }
    if (event.type === "pad") {
      particles.puff(car.x, car.z, 0.5);
      if (car.isPlayer) {
        sfx.pad();
        ui.showHint(false); // the controls hint has done its job
      }
    }
    if (event.type === "hit") {
      if (car.isPlayer) cameraRig.addShake(Math.min(CAMERA_FX.hitShakeMax, event.strength * CAMERA_FX.hitShakePerStrength));
      if (event.strength > 15) particles.puff(car.x, car.z, 0.6);
    }
  }
}

/** Depth-of-field focus/range per camera mode. */
function updateDepthOfField(player, camHeight) {
  const uniforms = composer.dof.uniforms;
  const distToPlayer = camera.position.distanceTo(tmpVec3A.set(player.x, player.y + 1, player.z));
  if (cameraRig.mode === "cockpit") {
    uniforms.focus.value = 14;
    uniforms.farStart.value = 2.6;
    uniforms.farEnd.value = 9;
    uniforms.nearAmt.value = 0;
    return;
  }
  // h: 0 = close chase (focus on car), 1 = high/top view (focus on rug plane)
  const h = cameraRig.mode === "top" || (cameraRig.mode === "chase" && cameraRig.view === "topdown") ? 1 : smoothstep(25, 110, camHeight);
  const distToRug = camHeight / Math.max(0.2, -camera.getWorldDirection(tmpVec3B).y);
  uniforms.focus.value = h < 1 ? Math.max(4, distToPlayer) * (1 - h) + Math.min(distToRug, 2e3) * h : camHeight;
  uniforms.farStart.value = 2.3 + (1.25 - 2.3) * h;
  uniforms.farEnd.value = 9 + -6 * h;
  uniforms.nearAmt.value = 0.25 * (1 - h);
}

/** Engine / tyre audio parameters from the player's state and nearest rival. */
function updateEngineAudio(session, race, player) {
  const active = !app.frozen && (app.mode === "race" || app.mode === "intro" || app.mode === "results" || (app.mode === "demo" && race.state !== "grid"));
  let rivalDist = 999;
  let rivalSpeed = 0;
  for (const other of race.cars) {
    if (other === player) continue;
    const dist = Math.hypot(other.x - player.x, other.z - player.z);
    if (dist < rivalDist) {
      rivalDist = dist;
      rivalSpeed = Math.abs(other.speed);
    }
  }
  sfx.engine({
    active: active && isPlayerVisible(player),
    speed: player.speed,
    throttle: app.mode === "results" ? 0.2 : Math.abs(player.speed) > 1 ? 1 : 0.2,
    boosting: player.boosting,
    offroad: player.offroad,
    skid: player.onGround ? clamp((Math.abs(player.latV) - 4) / 9, 0, 1) : 0,
    rivalDist,
    rivalSpeed,
  });
  if (session.cat && !session.cat.meowed && session.time - session.cat.t0 > session.cat.lead - 1) {
    session.cat.meowed = true;
    sfx.meow();
  }
}

/** Sync everything visual for this frame, drawing the interpolated car poses. dt = frame delta, time = visual clock. */
export function renderFrame(dt, time) {
  const cars = app.session.race.cars;
  applyBlend(cars, app.acc);
  try {
    renderFrameBlended(dt, time);
  } finally {
    restorePoses(cars);
  }
}

/** Original `Ab`. */
function renderFrameBlended(dt, time) {
  const session = app.session;
  const race = session.race;
  popup.update(time);
  aoField.begin();
  for (const item of popupItems) {
    if (!item.ao || !(item.level > 0)) continue;
    aoField.add(item.x, item.z, item.ao.w * 1.35, item.ao.d * 1.35, item.ao.rot, item.ao.round, Math.min(1, item.level) * 0.95);
  }
  race.cars.forEach((car, index) => syncCar(car, index, dt, time, session, race));
  updateGhost(session, race, time);
  updateDriftFx(session, race.player);
  if (obstacles.cat.root.visible) {
    for (const leg of obstacles.cat.legs) {
      leg.paw.getWorldPosition(tmpVec3A);
      aoField.add(tmpVec3A.x, tmpVec3A.z, 6, 6, 0, true, clamp(1 - tmpVec3A.y / 4, 0, 1) * 0.8);
    }
    aoField.add(obstacles.cat.root.position.x, obstacles.cat.root.position.z, 42 * 1.6, 18 * 1.6, obstacles.cat.root.rotation.y, true, 0.35);
  }
  {
    const ballCollider = obstacles.colliders.find((c) => c.ball);
    const ballItem = popupItems.find((item) => item.kind === "ball");
    // RE: original uses ball.x (layout) with the collider's z - kept as is
    if (ballCollider && ballItem && ballItem.level > 0) {
      aoField.add(ball.x, ballCollider.z, ball.r * 1.7, ball.r * 1.7, 0, true, ballItem.level * 0.9);
    }
  }
  aoField.end();
  updateFlyingBricks(dt);
  mapPreviewRoute.update(time);
  boostPadsView.update(time, dt, (x, z) => popup.levelAt(time, x, z), race.padOff);
  stage.classList.toggle("racing", app.mode === "race" || app.mode === "intro");
  for (const prop of sceneryProps.spinners) prop.obj.rotation[prop.axis] += prop.rate * dt;
  const player = race.player;
  cameraRig.others = race.cars;
  cameraRig.update(dt, time, player, player.boosting ? 1 : 0);
  const camHeight = camera.position.y;
  rugUniforms.uSun.value = 0.82 + 0.18 * Math.sin(time * 0.31) * Math.sin(time * 0.13 + 1);
  world.shaftMat.opacity = 0.2 * world.shaftScale * rugUniforms.uSun.value * clamp(1 - camHeight / 90, 0, 1);
  world.shafts.visible = world.shaftMat.opacity > 0.004;
  if (world.pile) {
    rugUniforms.uPileOn.value = smoothstep(80, 40, camHeight);
    world.pile.visible = rugUniforms.uPileOn.value > 0.01;
  }
  updateEngineAudio(session, race, player);
  const shadowSize = clamp(52 + camHeight * 0.42, 52, 190);
  const cos = Math.cos(player.a);
  const sin = Math.sin(player.a);
  const focusK = smoothstep(150, 20, camHeight);
  world.setShadowFocus(player.x * focusK + cos * 20 * focusK, player.z * focusK + sin * 20 * focusK, shadowSize);
  updateDepthOfField(player, camHeight);
  particles.update(dt, time, layout.renderHeightPx, player.boosting && player.onGround ? 1 : 0, camHeight);
  frameCounter++;
  if (app.mode !== "results" && layout.uiVisible && (ui.hud.classList.contains("show") || frameCounter % 6 === 0)) {
    ui.update(race, { wrongWay: app.mode !== "demo" && app.wrongT > 1, session });
  }
}
