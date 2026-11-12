// Small canvas textures for obstacles: beach ball, cat fur, sofa cushion.
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";

/** Six vertical beach-ball stripes with white caps at top/bottom (minified `nw`). */
export function makeBallTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const colors = ["#e5322b", "#f6f3ea", "#f2bd1d", "#2f6fd0", "#f6f3ea", "#1fa45a"];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect((i * 512) / 6, 0, 512 / 6 + 1, 256);
  }
  ctx.fillStyle = "#f6f3ea";
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 234, 512, 22);
  return new THREE.CanvasTexture(canvas);
}

/** Orange tabby fur: speckle strokes plus 13 wavy dark stripes (seed 31) (minified `iw`). */
export function makeCatFurTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e48c3a";
  ctx.fillRect(0, 0, 512, 512);
  const rand = mulberry32(31);
  for (let i = 0; i < 9e3; i++) {
    ctx.fillStyle = rand() < 0.5 ? "rgba(255,210,150,0.10)" : "rgba(120,50,10,0.10)";
    ctx.fillRect(rand() * 512, rand() * 512, 1.2, 6 + rand() * 8);
  }
  for (let s = 0; s < 13; s++) {
    const y0 = 30 + s * 36 + (rand() - 0.5) * 10;
    ctx.fillStyle = "rgba(150,62,18,0.75)";
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = y0 + Math.sin(x * 0.03 + s) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = 512; x >= 0; x -= 8) {
      ctx.lineTo(x, y0 + 9 + Math.sin(x * 0.05 + s * 2) * 4 + (Math.abs(x - 256) < 120 ? 4 : -2));
    }
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = "srgb";
  return tex;
}

/** Woven-looking tan cushion texture, repeat 8x8 (seed 8) (minified `sw`). */
export function makeSofaTopTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c7974a";
  ctx.fillRect(0, 0, 256, 256);
  const rand = mulberry32(8);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + rand() * 0.04})`;
    ctx.fillRect(0, y, 256, 1);
  }
  for (let x = 0; x < 256; x += 2) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.05})`;
    ctx.fillRect(x, 0, 1, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = "srgb";
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}
