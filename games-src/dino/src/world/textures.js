// Canvas-generated textures.  Bundle symbols: fu makeGroundTexture, pu makeSunGlowTexture.
import * as THREE from 'three';
import { rand } from '../util.js';

/** 512px tileable sand texture: soft blotches, wind ripples, grain speckles and pebbles. */
export function makeGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ecd7ae';
  ctx.fillRect(0, 0, 512, 512);
  // circle drawn at 9 wrapped offsets so the texture tiles seamlessly
  const dot = (x, y, r, fill) => {
    ctx.fillStyle = fill;
    for (const ox of [-512, 0, 512]) {
      if (x + ox + r < 0 || x + ox - r > 512) continue;
      for (const oy of [-512, 0, 512]) {
        if (y + oy + r < 0 || y + oy - r > 512) continue;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (let i = 0; i < 26; i++) {
    dot(rand(0, 512), rand(0, 512), rand(30, 80), Math.random() < 0.5 ? 'rgba(214,186,138,0.10)' : 'rgba(255,244,214,0.12)');
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const baseY = (i + 0.5) * (512 / 9) + rand(-8, 8);
    const amp = rand(3, 7);
    const waves = Math.round(rand(2, 4));
    const phase = rand(0, 6.28);
    ctx.strokeStyle = i % 2 ? 'rgba(190,158,108,0.34)' : 'rgba(255,246,222,0.42)';
    ctx.lineWidth = rand(2, 4.5);
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = baseY + Math.sin((x / 512) * Math.PI * 2 * waves + phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 2600; i++) {
    const dark = Math.random() < 0.6;
    dot(rand(0, 512), rand(0, 512), rand(0.5, 1.7), dark ? `rgba(150,112,66,${rand(0.15, 0.5)})` : `rgba(255,250,232,${rand(0.2, 0.6)})`);
  }
  for (let i = 0; i < 46; i++) dot(rand(0, 512), rand(0, 512), rand(2, 4.2), `rgba(140,108,70,${rand(0.25, 0.5)})`);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // bundle: `1e3`
  return texture;
}

/** 512px tileable snow texture: soft blue-grey drifts, wind ripples and faint sparkles (Snow environment). */
export function makeSnowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3f6fb';
  ctx.fillRect(0, 0, 512, 512);
  const dot = (x, y, r, fill) => {
    ctx.fillStyle = fill;
    for (const ox of [-512, 0, 512]) {
      for (const oy of [-512, 0, 512]) {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (let i = 0; i < 28; i++) dot(rand(0, 512), rand(0, 512), rand(30, 80), Math.random() < 0.55 ? 'rgba(176,196,222,0.13)' : 'rgba(255,255,255,0.2)');
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const baseY = (i + 0.5) * 64 + rand(-8, 8);
    ctx.strokeStyle = i % 2 ? 'rgba(170,190,218,0.3)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = rand(2, 4);
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const y = baseY + Math.sin((x / 512) * Math.PI * 2 * 3 + i) * rand(3, 5);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 1800; i++) dot(rand(0, 512), rand(0, 512), rand(0.5, 1.4), Math.random() < 0.5 ? 'rgba(150,172,205,0.35)' : 'rgba(255,255,255,0.7)');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Radial warm glow around the sun (additively blended on a big plane). */
export function makeSunGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,238,200,1)');
  g.addColorStop(0.07, 'rgba(255,214,150,0.85)');
  g.addColorStop(0.2, 'rgba(255,180,100,0.38)');
  g.addColorStop(0.5, 'rgba(255,150,80,0.1)');
  g.addColorStop(1, 'rgba(255,140,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
