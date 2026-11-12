import { RUG } from "../layoutSelect.js";

/** Create a detached 2D canvas of the given pixel size. */
export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Set the ctx transform so that rug world units (origin = rug centre) map to pixels.
 * @returns {number} pixels per world unit
 */
export function applyWorldTransform(ctx, pixelWidth) {
  const scale = pixelWidth / RUG.W;
  ctx.setTransform(scale, 0, 0, scale, (RUG.W / 2) * scale, (RUG.H / 2) * scale);
  return scale;
}

/** Stroke a polyline given as [[x, y], ...]; optionally closed. */
export function strokePolyline(ctx, points, close = false) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  if (close) ctx.closePath();
  ctx.stroke();
}

/** Wobbly ellipse path for a pond ({x, y, rx, ry, seed}), inflated by `grow`. */
export function pondPath(ctx, pond, grow = 0) {
  ctx.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const wobble = 1 + 0.07 * Math.sin(a * 3 + pond.seed) + 0.04 * Math.sin(a * 5 + pond.seed * 2.3);
    const px = pond.x + Math.cos(a) * (pond.rx + grow) * wobble;
    const py = pond.y + Math.sin(a) * (pond.ry + grow) * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Rounded rectangle path (x, y, w, h, radius) built with arcTo. */
export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
