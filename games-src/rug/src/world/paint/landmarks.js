import { COLORS } from "../mapPainter.js";
import { INK } from "../paintHelpers.js";
import { pondPath, roundRectPath } from "./canvasUtils.js";

/** Castle (hS): sand-coloured keep with gate and four red round towers at the corners. */
export function paintCastle(ctx, castle) {
  const left = castle.x - castle.w / 2;
  const top = castle.y - castle.d / 2;
  ctx.fillStyle = "rgba(20,40,15,0.22)";
  ctx.fillRect(left + 0.8, top + 0.8, castle.w, castle.d + 3.2);
  ctx.fillStyle = "#c99a78";
  ctx.fillRect(left, top, castle.w, castle.d);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.25;
  ctx.strokeRect(left, top, castle.w, castle.d);
  ctx.fillStyle = "#b8795a";
  ctx.fillRect(left, top + castle.d, castle.w, 3.2);
  ctx.strokeRect(left, top + castle.d, castle.w, 3.2);
  ctx.fillStyle = "#58342a";
  ctx.beginPath();
  ctx.arc(castle.x, top + castle.d + 3.2, 1.7, Math.PI, 0);
  ctx.fill();
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]) {
    const tx = castle.x + (sx * castle.w) / 2;
    const ty = castle.y + (sy * castle.d) / 2;
    ctx.fillStyle = "#c23a30";
    ctx.beginPath();
    ctx.arc(tx, ty, 3.1, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8574a";
    ctx.beginPath();
    ctx.arc(tx - 0.5, ty - 0.5, 1.5, 0, 7);
    ctx.fill();
  }
}

/** Carousel (uS): round path with a 16-wedge, 4-colour canopy. */
export function paintCarousel(ctx, carousel) {
  const radius = carousel.w / 2;
  pondPath(ctx, { x: carousel.x, y: carousel.y, rx: radius * 1.08, ry: radius * 1.08, seed: 1.4 });
  ctx.fillStyle = COLORS.path;
  ctx.fill();
  ctx.strokeStyle = COLORS.pathEdge;
  ctx.lineWidth = 0.3;
  ctx.stroke();
  const colors = ["#d8332a", "#f6d23a", "#2f6fc0", "#f6f4ea"];
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * 6.283;
    const a1 = ((i + 1) / 16) * 6.283;
    ctx.fillStyle = colors[i % 4];
    ctx.beginPath();
    ctx.moveTo(carousel.x, carousel.y);
    ctx.arc(carousel.x, carousel.y, radius * 0.8, a0, a1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.14;
    ctx.stroke();
  }
  ctx.fillStyle = "#f6d23a";
  ctx.beginPath();
  ctx.arc(carousel.x, carousel.y, 1.1, 0, 7);
  ctx.fill();
  ctx.stroke();
}

/** Tiny top-down parked car (pS) at (x, y) rotated by `angle`, body colour `color`. */
export function paintParkedCar(ctx, x, y, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRectPath(ctx, -2.4 + 0.3, -1.1 + 0.3, 4.8, 2.2, 0.7);
  ctx.fill();
  ctx.fillStyle = color;
  roundRectPath(ctx, -2.4, -1.1, 4.8, 2.2, 0.7);
  ctx.fill();
  ctx.fillStyle = "#2b3440";
  roundRectPath(ctx, -0.9, -0.85, 2, 1.7, 0.35);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-0.4, -0.75, 1, 1.5);
  ctx.fillStyle = "#fff3b0";
  ctx.fillRect(2.1, -0.85, 0.25, 0.45);
  ctx.fillRect(2.1, 0.4, 0.25, 0.45);
  ctx.restore();
}
