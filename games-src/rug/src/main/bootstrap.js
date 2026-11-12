// Scene/bootstrap: builds the world and instantiates every long-lived object.
// Uses top-level await; the loading bar progress is reported through bootStep(progress, label, hint).
// Original: top of the main module (lines ~31846-31892 and 32047-32056).
import { createWorld } from "../world/scene.js";
import { makePropMaterials } from "../world/propMaterials.js";
import { buildScenery } from "../scene/sceneryBuilder.js";
import { buildObstacles } from "../scene/obstacles.js";
import { Popper } from "../scene/popper.js";
import { ContactShadows } from "../world/contactShadows.js";
import { Particles } from "../fx/Particles.js";
import { CameraRig } from "../camera/CameraRig.js";
import { createPostFx } from "../render/postfx.js";
import { UI } from "../ui/UI.js";
import { buildClassicCar } from "../vehicles/classicCars.js";
import { buildLegoCar } from "../vehicles/legoCar.js";
import { createGrabHand } from "../effects/helicopter.js";
import { createRouteGuide } from "../effects/routeGuide.js";
import { createTrailMap } from "../effects/trailMap.js";
import { createBoostBatteries } from "../effects/batteries.js";
import { boostPads } from "../race/boostPads.js";
import { sfx } from "../audio/sfx.js";
import { sofaLegs } from "../world/layoutSelect.js";
import { bootStep } from "../boot/bootProgress.js";
import { stage, glCanvas } from "./stage.js";
import { CAMERA_FX } from "../config/camera.js";

export const world = await createWorld(glCanvas, bootStep);
export const { renderer, scene, camera } = world;
scene.add(camera);

export const propMaterials = makePropMaterials(world.fiber);
export const sceneryProps = await buildScenery(scene, propMaterials, bootStep);
await bootStep(0.56, "trees and fences", "Parking the cars…");

export const obstacles = buildObstacles(scene, world.fiber);
/** Everything that can be revealed by the "pop-up" wave (scenery + obstacles). Original: `lu`. */
export const popupItems = [...sceneryProps, ...obstacles.poppables];
obstacles.onSofaLand = () => {
  sfx.land(1);
  sfx.hit(30, 0.7);
  cameraRig.addShake(CAMERA_FX.sofaShake);
  for (const leg of sofaLegs) particles.puff(leg.x, leg.z, 1.3);
};

export const popup = new Popper(popupItems);
await bootStep(0.6, "obstacles");

export const aoField = new ContactShadows(scene);
export const particles = new Particles(scene, camera, world.lookup);
export const cameraRig = new CameraRig(camera);
export const composer = createPostFx(renderer, scene, camera);
export const ui = new UI(stage, world.lookup);
export const fpsEl = document.createElement("div");
fpsEl.className = "fps";
stage.appendChild(fpsEl);

export const classicCars = ["coupe", "pickup", "van", "formula"].map((kind, index) => {
  const car = buildClassicCar(kind, 100 + index); // RE: second arg is a per-model seed
  scene.add(car.root);
  return car;
});
await bootStep(0.66, "classic cars");

export const legoCars = [0, 1, 2, 3].map((model) => {
  const car = buildLegoCar(model);
  scene.add(car.root);
  return car;
});
/** Hand that picks the player's car up when leaving a race (Esc). */
export const grabHand = createGrabHand(scene);
/** Route overlay shown on the rug while previewing maps. */
export const mapPreviewRoute = createRouteGuide(scene);
await bootStep(0.72, "lego cars");

// Rug shader uniforms and the tyre-track render target.
export const rugUniforms = world.rugMat.userData.uniforms;
export const trailField = createTrailMap(renderer);
rugUniforms.uTrail.value = trailField.texture;
/** Boost battery pickups visuals. Original: `gb`. */
export const boostPadsView = createBoostBatteries(scene, boostPads);
