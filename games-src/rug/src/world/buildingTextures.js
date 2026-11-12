import * as THREE from "three";

/** 256px roof-shingle canvas texture: 8 rows of scalloped tiles, repeat-wrapped. */
export function makeShingleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);
  const rows = 8,
    cols = 8;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols + 1; col++) {
      const x = col * 32 + (row % 2) * 16 - 16,
        y = row * 32,
        gradient = ctx.createLinearGradient(0, y, 0, y + 32);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.75, "#e4e4e4");
      gradient.addColorStop(1, "#a8a8a8");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 32, y);
      ctx.lineTo(x + 32, y + 24);
      ctx.quadraticCurveTo(x + 16, y + 36, x, y + 24);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/** Blue 256px square with a white "P" (parking sign). */
export function makeParkingSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2a6fd0";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 210px "Arial Black", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", 128, 136);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
