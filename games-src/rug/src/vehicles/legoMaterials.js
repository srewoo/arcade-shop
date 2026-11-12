import * as THREE from "three";
import { mulberry32 } from "../util/math.js";

let legoSurfaceMapsCache = null;

/** Procedural plastic surface maps: tiling normal map (26 random sine waves) + mottled roughness canvas. Seed 4711. */
export function getLegoSurfaceMaps() {
  if (legoSurfaceMapsCache) return legoSurfaceMapsCache;
  const size = 256;
  const rand = mulberry32(4711);
  const height = new Float32Array(size * size);
  for (let k = 0; k < 26; k++) {
    const fx = ((1 + Math.floor(rand() * 7)) * 2 * Math.PI) / size;
    const fy = ((1 + Math.floor(rand() * 7)) * 2 * Math.PI) / size;
    const phase = rand() * 7;
    const amp = 0.4 + rand();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) height[y * size + x] += amp * Math.sin(x * fx + y * fy + phase);
  }
  const normalData = new Uint8Array(size * size * 4);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 1.1;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 1.1;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      normalData[o] = ((-dx / len) * 0.5 + 0.5) * 255;
      normalData[o + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      normalData[o + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      normalData[o + 3] = 255;
    }
  }
  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.generateMipmaps = true;
  normalMap.anisotropy = 4;
  normalMap.needsUpdate = true;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6a6a6a";
  ctx.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 260; k++) {
    ctx.fillStyle = `rgba(${rand() < 0.55 ? "255,255,255" : "0,0,0"},${0.04 + rand() * 0.07})`;
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 512, 6 + rand() * 34, 0, 7);
    ctx.fill();
  }
  ctx.lineCap = "round";
  for (let k = 0; k < 90; k++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const angle = rand() * 6.28;
    const len = 8 + rand() * 44;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + rand() * 0.45})`;
    ctx.lineWidth = 0.6 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  const roughnessMap = new THREE.CanvasTexture(canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = 4;
  legoSurfaceMapsCache = { normalMap, roughnessMap };
  return legoSurfaceMapsCache;
}

/** Glossy lego-plastic physical material; `overrides` are spread last. */
export function legoPlasticMaterial(color, overrides = {}) {
  const maps = getLegoSurfaceMaps();
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.62,
    roughnessMap: maps.roughnessMap,
    normalMap: maps.normalMap,
    normalScale: new THREE.Vector2(0.045, 0.045),
    metalness: 0.06,
    ior: 1.58,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    envMapIntensity: 1.9,
    ...overrides,
  });
}

let legoSharedMaterials = null;

/** Fixed-colour materials shared by all lego cars (the main/accent/tail ones are per car). */
export function getLegoSharedMaterials() {
  if (!legoSharedMaterials) {
    legoSharedMaterials = {
      dark: legoPlasticMaterial("#2b3036"),
      grey: legoPlasticMaterial("#9ba19d"),
      black: legoPlasticMaterial("#15171a", { roughness: 0.6, clearcoat: 0 }),
      skin: legoPlasticMaterial("#f7d117"),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#7fb6d6",
        roughness: 0.06,
        clearcoat: 1,
        transparent: true,
        opacity: 0.6,
        envMapIntensity: 1.6,
      }),
      head: legoPlasticMaterial("#fff4c2", { emissive: "#ffe9a0", emissiveIntensity: 1.5 }),
    };
  }
  return legoSharedMaterials;
}
