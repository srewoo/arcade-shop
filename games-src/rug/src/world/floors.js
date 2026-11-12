// Procedural floor textures (canvas, seeded) for the room-floor options. Parquet is the original texture.
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";
import { createParquetTexture } from "./parquetFloor.js";

function finish(canvas, repeat) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(repeat, repeat);
  return texture;
}

function darkWood() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(88);
  const boards = 12;
  const w = 1024 / boards;
  for (let i = 0; i < boards; i++) {
    const shade = rand();
    ctx.fillStyle = `rgb(${(58 + shade * 22) | 0},${(38 + shade * 14) | 0},${(28 + shade * 10) | 0})`;
    ctx.fillRect(i * w, 0, w, 1024);
    ctx.strokeStyle = "rgba(15,8,4,0.35)";
    ctx.lineWidth = 1.1;
    for (let g = 0; g < 14; g++) {
      const gx = i * w + 4 + rand() * (w - 8);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      for (let y = 0; y <= 1024; y += 24) ctx.lineTo(gx + Math.sin(y * 0.015 + g + i) * 2, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(i * w, 0, 2, 1024);
    for (let k = 0; k < 2; k++) ctx.fillRect(i * w, rand() * 1024, w, 2);
  }
  return finish(canvas, 24);
}

function tiles() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(101);
  const n = 4;
  const size = 1024 / n;
  ctx.fillStyle = "#9aa4aa";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const v = 214 + rand() * 20;
      ctx.fillStyle = (r + c) % 2 ? `rgb(${v | 0},${(v + 4) | 0},${(v + 8) | 0})` : `rgb(${(v - 60) | 0},${(v - 52) | 0},${(v - 40) | 0})`;
      ctx.fillRect(c * size + 5, r * size + 5, size - 10, size - 10);
      const g = ctx.createLinearGradient(c * size, r * size, (c + 1) * size, (r + 1) * size);
      g.addColorStop(0, "rgba(255,255,255,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0.08)");
      ctx.fillStyle = g;
      ctx.fillRect(c * size + 5, r * size + 5, size - 10, size - 10);
    }
  return finish(canvas, 50);
}

function grass() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(131);
  ctx.fillStyle = "#4f9a34";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() < 0.5 ? "rgba(120,190,70,0.28)" : "rgba(40,110,40,0.26)";
    ctx.beginPath();
    ctx.ellipse(rand() * 1024, rand() * 1024, 20 + rand() * 60, 14 + rand() * 40, rand() * 3, 0, 7);
    ctx.fill();
  }
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 9000; i++) {
    const x = rand() * 1024;
    const y = rand() * 1024;
    ctx.strokeStyle = rand() < 0.5 ? "rgba(30,90,30,0.55)" : "rgba(150,215,90,0.5)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 5, y - 4 - rand() * 8);
    ctx.stroke();
  }
  return finish(canvas, 36);
}

const cache = new Map();
/** Floor texture for an option id ("parquet" | "darkwood" | "tiles" | "grass"), built once. */
export function floorTexture(id) {
  if (!cache.has(id)) {
    if (id === "darkwood") cache.set(id, darkWood());
    else if (id === "tiles") cache.set(id, tiles());
    else if (id === "grass") cache.set(id, grass());
    else {
      const parquet = createParquetTexture();
      parquet.repeat.set(26, 26);
      cache.set("parquet", parquet);
    }
  }
  return cache.get(id === "darkwood" || id === "tiles" || id === "grass" ? id : "parquet");
}

/** Material tweaks per floor: glossy tiles, matte grass. */
export const FLOOR_MATERIAL = { parquet: [0.45, 0.7], darkwood: [0.4, 0.8], tiles: [0.18, 1.0], grass: [0.95, 0.2] };
