// Canvas textures for the classic (non-lego) toy cars: speckled body paint and round number decals.
import * as THREE from "three";
import { mulberry32 } from "../util/math.js";

/** Paint speckled/scuffed body onto a 512x512 canvas (minified `j0`). */
export function paintCarBodyTexture(canvas, baseColor, seed, stripeColor) {
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(seed);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);
  // soft light/dark blotches
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(${rand() < 0.5 ? "255,255,255" : "0,0,0"},${0.015 + rand() * 0.02})`;
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 512, 6 + rand() * 30, 0, 7);
    ctx.fill();
  }
  if (stripeColor) {
    ctx.fillStyle = stripeColor;
    ctx.fillRect(0, 226, 512, 22);
    ctx.fillRect(0, 264, 512, 22);
  }
  // paint chips (grey polygons, mostly near the edges)
  for (let i = 0; i < 38; i++) {
    const cx = rand() * 512;
    const cy = rand() < 0.6 ? (rand() < 0.5 ? rand() * 40 : 472 + rand() * 40) : rand() * 512;
    ctx.fillStyle = `rgba(215,218,222,${0.55 + rand() * 0.4})`;
    ctx.beginPath();
    const baseR = 1.5 + rand() * 4;
    for (let k = 0; k < 7; k++) {
      const ang = (k / 7) * Math.PI * 2;
      const r = baseR * (0.6 + rand() * 0.6);
      if (k === 0) ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      else ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();
  }
  // scratches
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 26; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const ang = rand() * Math.PI;
    const len = 8 + rand() * 30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
}

/** 512x512 sRGB body texture (minified `cw`). */
export function makeCarBodyTexture(baseColor, seed, stripeColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  paintCarBodyTexture(canvas, baseColor, seed, stripeColor);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = "srgb";
  tex.anisotropy = 4;
  return tex;
}

/** Round race-number decal: filled disc + outline + number (minified `hw`). */
export function makeNumberDecalTexture(number, fill, outline) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, 7);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = outline;
  ctx.stroke();
  ctx.fillStyle = outline;
  ctx.font = '900 84px "Arial Black", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = "srgb";
  return tex;
}
