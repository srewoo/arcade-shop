import { RUG } from "../world/layoutSelect.js";
import { TRACK } from "../world/trackSamples.js";
import { CLASSIC_CAR_SPECS } from "../vehicles/classicCars.js";

export const MINIMAP_W = 480;
export const MINIMAP_H = 336;

/** Pre-renders the static minimap background: rug lookup image, light veil, track polyline and start line. */
export function renderMinimapBackground(lookup) {
  const canvas = document.createElement("canvas");
  canvas.width = MINIMAP_W;
  canvas.height = MINIMAP_H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(lookup.canvas, 0, 0, MINIMAP_W, MINIMAP_H);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);
  // world units (centered) -> minimap pixels
  const scale = MINIMAP_W / RUG.W;
  ctx.setTransform(scale, 0, 0, MINIMAP_H / RUG.H, 240, 168);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(40,30,10,0.55)";
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  for (let i = 0; i <= TRACK.n; i++) {
    const k = i % TRACK.n;
    i === 0 ? ctx.moveTo(TRACK.x[k], TRACK.y[k]) : ctx.lineTo(TRACK.x[k], TRACK.y[k]);
  }
  ctx.stroke();
  ctx.strokeStyle = "#f7c525";
  ctx.lineWidth = 2.4;
  ctx.setLineDash([4, 2.5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#fff";
  ctx.fillRect(TRACK.x[0] - 0.8, TRACK.y[0] - 7, 1.6, 14);
  return canvas;
}

/** Draws background + every car (player last/on top, larger, with a direction arrow). */
export function drawMinimap(ctx, background, race, { labels = false } = {}) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(background, 0, 0);
  const scale = MINIMAP_W / RUG.W;
  ctx.setTransform(scale, 0, 0, MINIMAP_H / RUG.H, 240, 168);
  for (const car of [...race.cars].reverse()) {
    const look = { ...CLASSIC_CAR_SPECS[car.type], ...car.skin };
    ctx.save();
    ctx.translate(car.x, car.z);
    ctx.rotate(car.a);
    const k = (car.isPlayer ? 1.35 : 1) * 1.18;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(0.8, 0.8, 4.2 * k, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 4.2 * k, 0, 7);
    ctx.fill();
    ctx.fillStyle = look.color;
    ctx.beginPath();
    ctx.arc(0, 0, 3.1 * k, 0, 7);
    ctx.fill();
    if (labels && !car.isPlayer && car.position) {
      // colour-blind assist: the position number is the non-colour cue for every rival
      ctx.rotate(-car.a);
      ctx.font = `700 ${5.2 * k}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "#1e2126";
      ctx.strokeText(String(car.position), 0, 0.4);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(car.position), 0, 0.4);
      ctx.rotate(car.a);
    }
    if (car.isPlayer) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(4.6 * k, 0);
      ctx.lineTo(1.2 * k, -2.2 * k);
      ctx.lineTo(1.2 * k, 2.2 * k);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
