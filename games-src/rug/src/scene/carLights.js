// Headlight beam, exhaust/boost glow and brake-light emissive for the classic toy cars.
import * as THREE from "three";
import { PILE_HEIGHT } from "../world/fiberTextures.js";

/** 128x128 canvas texture painted by `paint(ctx)` (minified `ep`). */
export function makeCanvasTexture128(paint) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  paint(canvas.getContext("2d"));
  return new THREE.CanvasTexture(canvas);
}

let lightTexturesCache = null;

/** Lazily-created shared {beam, glow} textures (minified `lw`). */
export function getLightTextures() {
  if (!lightTexturesCache) {
    lightTexturesCache = {
      beam: makeCanvasTexture128((ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 128, 0);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.55, "rgba(255,255,255,0.45)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.filter = "blur(6px)";
        ctx.beginPath();
        ctx.moveTo(0, 54);
        ctx.lineTo(128, 6);
        ctx.lineTo(128, 122);
        ctx.lineTo(0, 74);
        ctx.closePath();
        ctx.fill();
      }),
      glow: makeCanvasTexture128((ctx) => {
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
      }),
    };
  }
  return lightTexturesCache;
}

/** Common params for additive, depth-write-free light sprites (minified `Hc`). */
export const additiveSpriteParams = (map, color, opacity) => ({
  map,
  color,
  opacity,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending, // RE: constant hs=2
  toneMapped: true,
});

/**
 * Attach light effects to a car model (minified `Z0`).
 * @param {{root: THREE.Object3D}} model car model
 * @param {THREE.MeshStandardMaterial} brakeMaterial material whose emissiveIntensity is boosted when braking
 * @param {number} baseEmissive resting emissive intensity of the brake material
 * @returns {{update(dt:number, car:object, visibility:number):void}}
 */
export function createCarLights(model, brakeMaterial, baseEmissive) {
  const tex = getLightTextures();
  const flatPlane = (w, h) => new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial(additiveSpriteParams(tex.beam, "#ffe6b0", 0.42));
  const beam = new THREE.Mesh(flatPlane(17, 11), beamMat);
  beam.position.set(11.4, 0.09, 0);
  beam.renderOrder = 2;
  const glowMat = new THREE.MeshBasicMaterial(additiveSpriteParams(tex.glow, "#ff7a1c", 0));
  const glowPlane = new THREE.Mesh(flatPlane(11, 8), glowMat);
  glowPlane.position.set(-4.2, 0.1, 0);
  glowPlane.renderOrder = 2;
  const spriteMat = new THREE.SpriteMaterial({ ...additiveSpriteParams(tex.glow, "#ffb040", 0) });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(-3.5, 1.15, 0);
  model.root.add(beam, glowPlane, sprite);
  for (const m of [beam, glowPlane]) m.castShadow = false;
  let boostGlow = 0;
  let brakeGlow = 0;
  return {
    /** @param car state with boosting, padT, braking, y (height above rug) */
    update(dt, car, visibility) {
      boostGlow += ((car.boosting || car.padT > 0 ? 1 : 0) - boostGlow) * Math.min(1, dt * 12);
      brakeGlow += ((car.braking ? 1 : 0) - brakeGlow) * Math.min(1, dt * 18);
      brakeMaterial.emissiveIntensity = baseEmissive + brakeGlow * 4;
      const groundFade = Math.max(0, 1 - car.y / 5);
      beam.position.y = 0.09 + PILE_HEIGHT - car.y;
      glowPlane.position.y = 0.1 + PILE_HEIGHT - car.y;
      beamMat.opacity = 0.42 * groundFade * visibility;
      const flicker = 0.75 + Math.random() * 0.25;
      glowMat.opacity = 0.75 * boostGlow * groundFade * flicker * visibility;
      spriteMat.opacity = 0.95 * boostGlow * flicker * visibility;
      sprite.scale.setScalar((2.2 + boostGlow * 1.5) * flicker);
      sprite.visible = boostGlow > 0.02;
      glowPlane.visible = boostGlow > 0.02;
    },
  };
}
