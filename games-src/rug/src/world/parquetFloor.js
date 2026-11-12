// Procedural wooden parquet floor texture surrounding the rug (1024px canvas, seed 55).
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";

/** Rows of random-length planks in warm browns with grain lines and dark seams. */
export function createParquetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(55);
  const rows = 8;
  const rowH = 1024 / rows;
  for (let row = 0; row < rows; row++) {
    let x = -rand() * 400;
    while (x < 1024) {
      const plankLen = 300 + rand() * 380;
      const rgb = [150 + rand() * 26, 112 + rand() * 20, 78 + rand() * 14];
      ctx.fillStyle = `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
      ctx.fillRect(x, row * rowH, plankLen, rowH);
      ctx.strokeStyle = "rgba(80,45,20,0.18)";
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 9; g++) {
        const gy = row * rowH + 6 + rand() * (rowH - 12);
        ctx.beginPath();
        ctx.moveTo(x, gy);
        for (let dx = 0; dx <= plankLen; dx += 20) ctx.lineTo(x + dx, gy + Math.sin(dx * 0.02 + g) * 2.5);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(40,20,8,0.55)";
      ctx.fillRect(x, row * rowH, 2, rowH);
      x += plankLen;
    }
    ctx.fillStyle = "rgba(40,20,8,0.55)";
    ctx.fillRect(0, row * rowH, 1024, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
