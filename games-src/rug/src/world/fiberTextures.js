// Procedural carpet-fibre textures (tufts + strands) shared by the rug and every "carpet pile" material.
import * as THREE from "three";
import { mulberry32, IS_COARSE_POINTER } from "../util/math.js";

export const FIBER_TEX_SIZE = 512;
/** World units covered by one repeat of the fibre texture (pile scale). */
export const FIBER_WORLD_SIZE = 4.5;
/** Total height of the shell pile; disabled on coarse pointers (mobile). */
export const PILE_HEIGHT = IS_COARSE_POINTER ? 0 : 0.4;
export const PILE_LAYERS = 6;

/**
 * Generate tuft fields with seeded RNG (seed 99): 12px grid of jittered elliptical tufts (two per
 * cell, second offset by half a cell) plus 4200 random fibre strands.
 * @returns {{N:number,height:Float32Array,jx:Float32Array,jy:Float32Array,jw:Float32Array,tint:Float32Array}}
 */
function generateFiberFields() {
  const rand = mulberry32(99);
  const N = FIBER_TEX_SIZE;
  const height = new Float32Array(N * N);
  const jx = new Float32Array(N * N); // accumulated tuft direction x (weighted)
  const jy = new Float32Array(N * N);
  const jw = new Float32Array(N * N); // accumulated weights
  const tint = new Float32Array(N * N);
  const cell = 12;
  const wrap = (c) => ((c % N) + N) % N;
  for (let cy = 0; cy < N / cell; cy++) {
    for (let cx = 0; cx < N / cell; cx++) {
      for (let k = 0; k < 2; k++) {
        const px = cx * cell + (k ? cell * 0.5 : 0) + (rand() - 0.5) * cell * 0.7;
        const py = cy * cell + (k ? cell * 0.5 : 0) + (rand() - 0.5) * cell * 0.7;
        const radius = cell * (0.5 + rand() * 0.3);
        const angle = rand() * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const peak = 0.55 + rand() * 0.45;
        const tuftTint = rand();
        const shear = (rand() - 0.5) * 0.6;
        for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
          for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
            const sx = dx + dy * shear * 0.3;
            const d = (sx * sx + dy * dy) / (radius * radius);
            if (d > 1) continue;
            const idx = wrap(Math.round(py + dy)) * N + wrap(Math.round(px + dx));
            const fall = 1 - d;
            const h = peak * fall * fall * (0.85 + 0.15 * Math.sin((dx * cosA + dy * sinA) * 1.7));
            if (h > height[idx]) { height[idx] = h; tint[idx] = tuftTint; }
            jx[idx] += cosA * fall;
            jy[idx] += sinA * fall;
            jw[idx] += fall;
          }
        }
      }
    }
  }
  for (let strand = 0; strand < 4200; strand++) {
    let x = rand() * N;
    let y = rand() * N;
    const dir = rand() * Math.PI * 2;
    const len = 4 + rand() * 10;
    for (let step = 0; step < len; step++) {
      x += Math.cos(dir + Math.sin(step * 0.4) * 0.5);
      y += Math.sin(dir + Math.sin(step * 0.4) * 0.5);
      const idx = wrap(Math.round(y)) * N + wrap(Math.round(x));
      height[idx] = Math.max(height[idx], 0.75 + rand() * 0.25);
    }
  }
  return { N, height, jx, jy, jw, tint };
}

/**
 * Build the two RGBA textures.
 *  fiber:  R,G = mean tuft direction (jitter), B = tuft height, A = per-tuft tint
 *  normal: tangent-space normal from the height gradient (scale 2.2)
 */
export function createFiberTextures() {
  const { N, height, jx, jy, jw, tint } = generateFiberFields();
  const fiberData = new Uint8Array(N * N * 4);
  const normalData = new Uint8Array(N * N * 4);
  const h = (x, y) => height[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const idx = y * N + x;
      const w = jw[idx] || 1;
      fiberData[idx * 4] = Math.max(0, Math.min(255, 128 + (jx[idx] / w) * 120));
      fiberData[idx * 4 + 1] = Math.max(0, Math.min(255, 128 + (jy[idx] / w) * 120));
      fiberData[idx * 4 + 2] = Math.min(255, height[idx] * 255);
      fiberData[idx * 4 + 3] = tint[idx] * 255;
      const gx = (h(x + 1, y) - h(x - 1, y)) * 2.2;
      const gy = (h(x, y + 1) - h(x, y - 1)) * 2.2;
      const gz = 1;
      const len = Math.hypot(gx, gy, gz);
      normalData[idx * 4] = ((-gx / len) * 0.5 + 0.5) * 255;
      normalData[idx * 4 + 1] = ((gy / len) * 0.5 + 0.5) * 255;
      normalData[idx * 4 + 2] = ((gz / len) * 0.5 + 0.5) * 255;
      normalData[idx * 4 + 3] = 255;
    }
  }
  const makeTexture = (data) => {
    const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };
  return { fiber: makeTexture(fiberData), normal: makeTexture(normalData) };
}
