import * as THREE from "three";
import { applyCarpetPile } from "./carpetPile.js";
import { makeShingleTexture } from "./buildingTextures.js";

/**
 * Shared materials for props (all vertex-coloured MeshStandardMaterial with
 * the rug's fibre/pile shader patched in, except glass).
 * @param {object} fiber rug fibre texture bundle (Rug.fiber)
 */
export function makePropMaterials(fiber) {
  const shingles = makeShingleTexture();
  return {
    fiber,
    body: applyCarpetPile(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), fiber, {
      scale: 7,
      bump: 0.12,
    }),
    flat: applyCarpetPile(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }),
      fiber,
      { scale: 6, bump: 0.14 },
    ),
    roof: applyCarpetPile(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: shingles }),
      fiber,
      { scale: 7, bump: 0.12, fuzz: [0.03, 0.03] },
    ),
    glass: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.08,
      metalness: 0.1,
      envMapIntensity: 1.4,
    }),
    plastic: applyCarpetPile(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), fiber, {
      scale: 7,
      bump: 0.12,
    }),
  };
}
