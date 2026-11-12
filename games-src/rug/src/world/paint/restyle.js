// Print restyling: theme grading, persian / blueprint patterns, snow speckle and shape clipping.
// Operates on the painted canvas only: routes, colliders and the road/water mask are never touched.
import { mulberry32 } from "../../util/math.js";
import { gradeRgb, THEME_PALETTES } from "../../logic/appearance.js";
import { createCanvas, pondPath, strokePolyline } from "./canvasUtils.js";
import { RUG, pondsPlanar, parkingRects } from "../layoutSelect.js";
import { COLORS } from "../mapPainter.js";
import { insideShape } from "../../logic/shapeRoutes.js";

/** Run `fn` with COLORS temporarily overridden by the theme's palette (classic/neon/pastel: no override). */
export async function withThemePalette(theme, fn) {
  const palette = THEME_PALETTES[theme] ?? {};
  const saved = {};
  for (const key of Object.keys(palette)) saved[key] = COLORS[key];
  Object.assign(COLORS, palette);
  try {
    return await fn();
  } finally {
    Object.assign(COLORS, saved);
  }
}

/** Per-pixel theme grade through a 6-bit-per-channel lookup table (fast on 16M pixel canvases). */
export function gradeCanvas(canvas, theme) {
  if (theme === "classic") return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const lut = new Int32Array(1 << 18).fill(-1);
  for (let i = 0; i < d.length; i += 4) {
    const key = ((d[i] >> 2) << 12) | ((d[i + 1] >> 2) << 6) | (d[i + 2] >> 2);
    let packed = lut[key];
    if (packed < 0) {
      const [r, g, b] = gradeRgb(theme, ((d[i] >> 2) * 4 + 2) / 255, ((d[i + 1] >> 2) * 4 + 2) / 255, ((d[i + 2] >> 2) * 4 + 2) / 255);
      packed = (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
      lut[key] = packed;
    }
    d[i] = packed >> 16;
    d[i + 1] = (packed >> 8) & 255;
    d[i + 2] = packed & 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Winter: scatter soft snow flecks over the whole print (own RNG). */
export function speckleSnow(canvas) {
  const ctx = canvas.getContext("2d");
  const rnd = mulberry32(7771);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.5})`;
    ctx.beginPath();
    ctx.arc(rnd() * canvas.width, rnd() * canvas.height, (canvas.width / 4800) * (1.5 + rnd() * 4), 0, 7);
    ctx.fill();
  }
}

/** Blueprint: blue sheet with a faint grid; white line-art taken from the colour edges of the playmat print. */
export function blueprintCanvas(source) {
  const w = Math.round(source.width / 3);
  const h = Math.round(source.height / 3);
  const small = createCanvas(w, h);
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(source, 0, 0, w, h);
  const src = sctx.getImageData(0, 0, w, h).data;
  const out = sctx.createImageData(w, h);
  const o = out.data;
  const edge = new Uint8Array(w * h);
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const r = i + 4;
      const b = i + w * 4;
      const dx = Math.abs(src[i] - src[r]) + Math.abs(src[i + 1] - src[r + 1]) + Math.abs(src[i + 2] - src[r + 2]);
      const dy = Math.abs(src[i] - src[b]) + Math.abs(src[i + 1] - src[b + 1]) + Math.abs(src[i + 2] - src[b + 2]);
      if (dx > 54 || dy > 54) {
        edge[y * w + x] = 1;
        edge[y * w + x + 1] = 1;
      }
    }
  for (let p = 0; p < w * h; p++) {
    const j = p * 4;
    o[j] = edge[p] ? 236 : 24;
    o[j + 1] = edge[p] ? 244 : 72;
    o[j + 2] = edge[p] ? 255 : 150;
    o[j + 3] = 255;
  }
  sctx.putImageData(out, 0, 0);
  const result = createCanvas(source.width, source.height);
  const ctx = result.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, source.width, source.height);
  ctx.strokeStyle = "rgba(190,220,255,0.16)";
  ctx.lineWidth = source.width / 4800;
  const unit = source.width / RUG.W;
  for (let x = 0; x <= RUG.W; x += 10) strokePolyline(ctx, [[x * unit, 0], [x * unit, source.height]]);
  for (let y = 0; y <= RUG.H; y += 10) strokePolyline(ctx, [[0, y * unit], [source.width, y * unit]]);
  return result;
}

/** Persian rug ground (world-transformed ctx): field, borders, lattice, medallion, corner spandrels, lakes. */
export function paintPersianGround(ctx) {
  const rnd = mulberry32(9091);
  const hw = RUG.W / 2;
  const hh = RUG.H / 2;
  const diamond = (x, y, rx, ry, fill, stroke) => {
    ctx.beginPath();
    ctx.moveTo(x, y - ry);
    ctx.lineTo(x + rx, y);
    ctx.lineTo(x, y + ry);
    ctx.lineTo(x - rx, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  };
  ctx.fillStyle = "#1d2b55";
  ctx.fillRect(-hw, -hh, RUG.W, RUG.H);
  const bands = [[2.4, "#f0e2bc"], [6.2, "#8f1d2c"], [11, "#e9d8a6"], [12.6, "#1d2b55"]];
  for (const [inset, color] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(-hw + inset, -hh + inset, RUG.W - inset * 2, RUG.H - inset * 2);
  }
  ctx.fillStyle = "#8e1b2b";
  ctx.fillRect(-hw + 12.6, -hh + 12.6, RUG.W - 25.2, RUG.H - 25.2);
  for (let x = -hw + 7; x < hw - 6; x += 5.2) {
    for (const y of [-hh + 8.6, hh - 8.6]) diamond(x, y, 1.9, 1.9, rnd() < 0.5 ? "#e9d8a6" : "#1d2b55");
  }
  for (let y = -hh + 7; y < hh - 6; y += 5.2) {
    for (const x of [-hw + 8.6, hw - 8.6]) diamond(x, y, 1.9, 1.9, rnd() < 0.5 ? "#e9d8a6" : "#1d2b55");
  }
  for (let x = -hw + 22; x < hw - 14; x += 22)
    for (let y = -hh + 20; y < hh - 12; y += 20) {
      diamond(x, y, 7.5, 7.5, "rgba(29,43,85,0.55)", "rgba(233,216,166,0.55)");
      diamond(x, y, 3.2, 3.2, "rgba(233,216,166,0.6)");
    }
  for (const [rx, ry, color] of [[62, 42, "#1d2b55"], [54, 35, "#e9d8a6"], [46, 28, "#8e1b2b"], [32, 19, "#1d2b55"], [18, 10, "#e9d8a6"]]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, 7);
    ctx.fillStyle = color;
    ctx.fill();
  }
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.beginPath();
    ctx.arc(sx * (hw - 12.6), sy * (hh - 12.6), 18, 0, 7);
    ctx.fillStyle = "rgba(233,216,166,0.8)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx * (hw - 12.6), sy * (hh - 12.6), 11, 0, 7);
    ctx.fillStyle = "#1d2b55";
    ctx.fill();
  }
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = rnd() < 0.5 ? "rgba(255,240,200,0.07)" : "rgba(0,0,0,0.07)";
    ctx.fillRect((rnd() * 2 - 1) * hw, (rnd() * 2 - 1) * hh, 0.5, 0.5);
  }
  // lakes (ponds slow the car, so they must stay visible) and parking as gold panels
  for (const pond of pondsPlanar) {
    pondPath(ctx, pond, 1.2);
    ctx.fillStyle = "#e9d8a6";
    ctx.fill();
    pondPath(ctx, pond);
    ctx.fillStyle = COLORS.water;
    ctx.fill();
  }
  ctx.fillStyle = "rgba(233,216,166,0.9)";
  for (const p of parkingRects) ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
}

/** Clip a finished print to the rug shape: everything outside becomes transparent. */
export function maskToShape(canvas, shape) {
  if (!shape) return;
  const ctx = canvas.getContext("2d");
  const unit = canvas.width / RUG.W;
  const mask = createCanvas(canvas.width, canvas.height);
  const m = mask.getContext("2d");
  m.setTransform(unit, 0, 0, unit, canvas.width / 2, canvas.height / 2);
  m.fillStyle = "#000";
  m.beginPath();
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    // sample the boundary by marching outward until insideShape fails
    const dx = Math.cos(t);
    const dz = Math.sin(t);
    let lo = 0;
    let hi = 200;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (insideShape(shape, dx * mid, dz * mid, 0)) lo = mid;
      else hi = mid;
    }
    if (i === 0) m.moveTo(dx * lo, dz * lo);
    else m.lineTo(dx * lo, dz * lo);
  }
  m.closePath();
  m.fill();
  ctx.globalCompositeOperation = "destination-in";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}
