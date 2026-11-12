// GPU warm-up executed during boot: forces every texture upload and shader compile (while the loading
// bar animates in its worker), then renders two frames so the first real frame does not hitch.
import { bootStep } from "../boot/bootProgress.js";
import { world, renderer, scene, camera, composer, popup, obstacles, grabHand, classicCars, legoCars, cameraRig } from "./bootstrap.js";
import { app } from "./state.js";
import { applySkins } from "./garage.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 24));

/** Original `Lb`. */
export async function warmUpGpu() {
  popup.setFull();
  popup.update(0);
  const cat = obstacles.cat.root;
  const catWasVisible = cat.visible;
  cat.visible = true;
  cat.position.set(-52, 0, 0);
  const allCars = [...classicCars, ...legoCars];
  grabHand.root.visible = true;
  grabHand.update(0.01, { x: 0, z: 40, a: 0 }, 0);
  allCars.forEach((car, index) => {
    car.root.visible = true;
    car.root.scale.set(1, 1, 1);
    car.root.position.set(-40 + index * 8, 0, 52);
  });
  // collect every texture referenced by materials (incl. rug shader uniforms)
  const textures = new Set();
  scene.traverse((object) => {
    if (!object.material) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value && value.isTexture && !textures.has(value)) textures.add(value);
      for (const uniform of Object.values(material.userData.pile || material.userData.uniforms || {})) {
        if (uniform.value && uniform.value.isTexture && !uniform.value.isRenderTargetTexture && !textures.has(uniform.value)) {
          textures.add(uniform.value);
        }
      }
    }
  });
  let uploaded = 0;
  for (const texture of textures) {
    renderer.initTexture(texture);
    // yield after big textures and every 8th one so the page stays responsive
    if ((texture.image?.width || 0) >= 2048 || ++uploaded % 8 === 0) await tick();
  }
  await bootStep(0.8, "upload textures", "Waking up the cat…");
  const compiling = renderer.compileAsync(scene, camera);
  const progressTimer = setInterval(() => {
    const programs = renderer.info.programs;
    const ready = programs.filter((program) => program.isReady()).length;
    window.__bootLoader?.set(0.8 + 0.1 * (ready / Math.max(1, programs.length)));
  }, 60);
  await compiling;
  clearInterval(progressTimer);
  await bootStep(0.9, "compile shaders", "Almost there…");
  await tick();
  const savedMode = cameraRig.mode;
  cameraRig.mode = "top";
  cameraRig.update(0, 0, app.session.race.player, 0);
  world.setShadowFocus(0, 0, 190);
  composer.render(0);
  await bootStep(0.98, "first render");
  // second render from a low angle so close-range shaders/shadow cascades are also warmed
  camera.position.set(-60, 5, 60);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 2, 0);
  camera.near = 0.1;
  camera.updateProjectionMatrix();
  world.setShadowFocus(-40, 40, 45);
  composer.render(0);
  cameraRig.mode = savedMode;
  cat.visible = catWasVisible;
  popup.setFlat();
  popup.update(0);
  grabHand.root.visible = false;
  applySkins(app.session);
}
