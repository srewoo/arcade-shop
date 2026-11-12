// Title-screen hero: the ten-cat pyramid, drawn with the in-game cat sprite.
import { drawCatBody } from './cat';
import { drawYarn } from './ball';
import type { Camera } from './camera';
import { assignKinds } from '../layout';
import { mulberry32 } from '../rng';

const ROWS = 4;

/** Paint a static rack of cats onto `canvas` (its width/height are the backing size). */
export function paintTitleCats(canvas: HTMLCanvasElement): void {
  const g = canvas.getContext('2d');
  if (!g) return;
  const w = canvas.width, h = canvas.height;
  const k = h / 150;
  const kinds = assignKinds(mulberry32(4242));
  g.clearRect(0, 0, w, h);
  stage(g, w, h);
  let n = 0;
  // Back row (4 cats) first so the head cat ends up in front.
  for (let row = 0; row < ROWS; row++) {
    const count = ROWS - row;
    for (let i = 0; i < count; i++) {
      const x = w / 2 + (i - (count - 1) / 2) * 62 * k * 1.15;
      const y = h * (0.46 + row * 0.15);
      g.save();
      g.translate(x, y); g.scale(k, k);
      g.lineJoin = 'round'; g.lineCap = 'round';
      drawCatBody(g, { kind: kinds[n % kinds.length] ?? 'plain', coat: (n * 2 + row) % 6, pose: { name: 'stand', z: 0, rot: 0, sinceLand: 0 }, yowl: false, assist: false, time: n * 0.7 });
      g.restore();
      n++;
    }
  }
  rollingYarn(g, w, h);
}

/** Warm spotlight, a wood stage and a few sparkles behind the rack. */
function stage(g: CanvasRenderingContext2D, w: number, h: number): void {
  const beam = g.createRadialGradient(w / 2, h * 0.1, 8, w / 2, h * 0.55, w * 0.5);
  beam.addColorStop(0, 'rgba(255,236,170,0.55)'); beam.addColorStop(1, 'rgba(255,236,170,0)');
  g.fillStyle = beam; g.beginPath(); g.moveTo(w * 0.44, 0); g.lineTo(w * 0.56, 0); g.lineTo(w * 0.92, h); g.lineTo(w * 0.08, h); g.closePath(); g.fill();
  const wood = g.createLinearGradient(0, h * 0.72, 0, h);
  wood.addColorStop(0, '#f0d4a0'); wood.addColorStop(1, '#c99556');
  g.fillStyle = 'rgba(43,36,32,0.16)';
  g.beginPath(); g.ellipse(w / 2, h * 0.93, w * 0.44, h * 0.09, 0, 0, 7); g.fill();
  g.fillStyle = wood; g.strokeStyle = '#2b2420'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.42, h * 0.085, 0, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(150,100,50,0.45)'; g.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.1, h * 0.83); g.lineTo(w / 2 + i * w * 0.12, h * 0.97); g.stroke(); }
  g.fillStyle = '#fff8d8';
  for (const [x, y, r] of [[0.1, 0.2, 6], [0.9, 0.3, 8], [0.18, 0.55, 4], [0.84, 0.62, 5], [0.7, 0.1, 5]] as const) {
    g.beginPath(); g.moveTo(w * x, h * y - r * 2); g.quadraticCurveTo(w * x, h * y, w * x + r * 2, h * y); g.quadraticCurveTo(w * x, h * y, w * x, h * y + r * 2); g.quadraticCurveTo(w * x, h * y, w * x - r * 2, h * y); g.quadraticCurveTo(w * x, h * y, w * x, h * y - r * 2); g.fill();
  }
}

function rollingYarn(g: CanvasRenderingContext2D, w: number, h: number): void {
  const x = w * 0.1, y = h * 0.8;
  g.strokeStyle = 'rgba(43,36,32,0.45)'; g.lineWidth = 3; g.lineCap = 'round'; g.setLineDash([2, 9]);
  g.beginPath(); g.moveTo(x - 70, y - 4); g.lineTo(x - 28, y - 4); g.stroke(); g.setLineDash([]);
  const cam: Camera = { w, h, portrait: false, k: h / 150, project: (px, py, z = 0) => ({ x: px, y: py - z * (h / 150) }) };
  drawYarn(g, cam, x, y, 0.6);
}
