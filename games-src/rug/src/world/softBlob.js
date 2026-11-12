// Soft alpha blob sprite texture (128px). Used for shadows/glows/particles elsewhere.
import * as THREE from "three";

/**
 * @param {boolean} circular true: round falloff; false: rounded-square ("squircle", 6-norm) falloff
 */
export function makeSoftBlobTexture(circular) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const nx = (x + 0.5) / 64 - 1;
      const ny = (y + 0.5) / 64 - 1;
      let dist;
      if (circular) dist = Math.hypot(nx, ny);
      else dist = Math.pow(Math.pow(Math.abs(nx), 6) + Math.pow(Math.abs(ny), 6), 1 / 6);
      const t = Math.max(0, Math.min(1, (1 - dist) / 0.42));
      const idx = (y * 128 + x) * 4;
      image.data[idx] = image.data[idx + 1] = image.data[idx + 2] = 255;
      image.data[idx + 3] = Math.round(t * t * (3 - 2 * t) * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  return new THREE.CanvasTexture(canvas);
}
