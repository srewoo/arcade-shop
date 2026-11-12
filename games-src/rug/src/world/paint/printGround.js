import { mulberry32 } from "../../util/math.js";
import { COLORS } from "../mapPainter.js";
import { RUG, pondsPlanar, mainField } from "../layoutSelect.js";
import { pondPath } from "./canvasUtils.js";

/**
 * Border, grass base (patches + tufts), ponds and the football pitch.
 * `rng` is the shared Ye(4242) generator: call order is part of the look.
 */
export function paintGround(ctx, rng) {
  const halfW = RUG.W / 2;
  const halfH = RUG.H / 2;
  const border = RUG.border;
  ctx.fillStyle = COLORS.border;
  ctx.fillRect(-halfW, -halfH, RUG.W, RUG.H);
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(-halfW + border, -halfH + border, RUG.W - border * 2, RUG.H - border * 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-halfW + border, -halfH + border, RUG.W - border * 2, RUG.H - border * 2);
  ctx.clip();
  for (let i = 0; i < 70; i++) {
    const x = (rng() * 2 - 1) * (halfW - border);
    const y = (rng() * 2 - 1) * (halfH - border);
    ctx.fillStyle = rng() < 0.5 ? "rgba(124,192,76,0.35)" : "rgba(79,154,49,0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rng() * 12, 4 + rng() * 8, rng() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = COLORS.grassDark;
  ctx.lineWidth = 0.18;
  ctx.lineCap = "round";
  for (let i = 0; i < 1600; i++) {
    const x = (rng() * 2 - 1) * (halfW - border - 1);
    const y = (rng() * 2 - 1) * (halfH - border - 1);
    const size = 0.5 + rng() * 0.4;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.6, y - size);
    ctx.lineTo(x, y);
    ctx.lineTo(x + size * 0.6, y - size);
    ctx.stroke();
  }
  ctx.restore();
  for (const pond of pondsPlanar) paintPond(ctx, pond);
  paintFootballPitch(ctx, mainField);
}

function paintPond(ctx, pond) {
  ctx.fillStyle = COLORS.grassEdge;
  pondPath(ctx, pond, 2.3);
  ctx.fill();
  ctx.fillStyle = COLORS.sand;
  pondPath(ctx, pond, 1.8);
  ctx.fill();
  ctx.fillStyle = COLORS.waterDeep;
  pondPath(ctx, pond, 0.5);
  ctx.fill();
  ctx.fillStyle = COLORS.water;
  pondPath(ctx, pond, -0.3);
  ctx.fill();
  ctx.fillStyle = COLORS.waterLight;
  pondPath(ctx, {
    ...pond,
    x: pond.x - pond.rx * 0.18,
    y: pond.y - pond.ry * 0.2,
    rx: pond.rx * 0.45,
    ry: pond.ry * 0.4,
  });
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 0.3;
  const pr = mulberry32(pond.seed + 11);
  // ripples
  for (let i = 0; i < 9; i++) {
    const x = pond.x + (pr() - 0.5) * pond.rx * 1.2;
    const y = pond.y + (pr() - 0.5) * pond.ry * 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 1.2, y);
    ctx.quadraticCurveTo(x - 0.6, y - 0.6, x, y);
    ctx.quadraticCurveTo(x + 0.6, y + 0.6, x + 1.2, y);
    ctx.stroke();
  }
  // lily pads (first one has a pink flower)
  for (let i = 0; i < 5; i++) {
    const a = pr() * Math.PI * 2;
    const size = 0.6 + pr() * 0.3;
    const lx = pond.x + Math.cos(a) * pond.rx * 0.7;
    const ly = pond.y + Math.sin(a) * pond.ry * 0.7;
    ctx.fillStyle = "#4fae46";
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.arc(lx, ly, size, a + 0.4, a + Math.PI * 2 - 0.2);
    ctx.closePath();
    ctx.fill();
    if (i === 0) {
      ctx.fillStyle = "#f39ab8";
      ctx.beginPath();
      ctx.arc(lx, ly, 0.3, 0, 7);
      ctx.fill();
    }
  }
  // rubber duck
  const dx = pond.x + pond.rx * 0.2;
  const dy = pond.y + pond.ry * 0.25;
  ctx.fillStyle = "#f6d23a";
  ctx.beginPath();
  ctx.ellipse(dx, dy, 1.2, 0.8, 0.3, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(dx + 1, dy - 0.3, 0.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#f08a24";
  ctx.beginPath();
  ctx.moveTo(dx + 1.4, dy - 0.4);
  ctx.lineTo(dx + 2, dy - 0.25);
  ctx.lineTo(dx + 1.4, dy - 0.05);
  ctx.fill();
  // reeds around the shore
  ctx.strokeStyle = "#2f7d34";
  ctx.lineWidth = 0.2;
  for (let i = 0; i < 14; i++) {
    const a = pr() * Math.PI * 2;
    const rx = pond.x + Math.cos(a) * (pond.rx + 0.8);
    const ry = pond.y + Math.sin(a) * (pond.ry + 0.8);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + (pr() - 0.5), ry - 1.2);
    ctx.stroke();
  }
  if (pond.island) {
    ctx.fillStyle = COLORS.sand;
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, 13, 11, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = COLORS.grass;
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, 12, 10, 0, 0, 7);
    ctx.fill();
  }
}

/** Striped football pitch with centre circle, penalty boxes, goals and corner arcs. */
function paintFootballPitch(ctx, field) {
  const left = field.x - field.w / 2;
  const top = field.y - field.h / 2;
  const u = field.w / 44; // RE: pitch is designed on a 44-unit-wide grid
  ctx.fillStyle = "#e9e5d8";
  ctx.fillRect(left - 2.2, top - 2.2, field.w + 4.4, field.h + 4.4);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(left - 1.4, top - 1.4, field.w + 2.8, field.h + 2.8);
  for (let i = 0; i < 11; i++) {
    if (i % 2) {
      ctx.fillStyle = COLORS.fieldDark;
      ctx.fillRect(left + (i * field.w) / 11, top, field.w / 11, field.h);
    }
  }
  ctx.strokeStyle = "#f7f7f2";
  ctx.lineWidth = 0.32 * u;
  ctx.strokeRect(left, top, field.w, field.h);
  ctx.beginPath();
  ctx.moveTo(field.x, top);
  ctx.lineTo(field.x, top + field.h);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(field.x, field.y, 4.2 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f7f7f2";
  ctx.beginPath();
  ctx.arc(field.x, field.y, 0.35, 0, 7);
  ctx.fill();
  for (const side of [-1, 1]) {
    const edge = side < 0 ? left : left + field.w;
    ctx.strokeRect(side < 0 ? edge : edge - 6.5 * u, field.y - 7 * u, 6.5 * u, 14 * u);
    ctx.strokeRect(side < 0 ? edge : edge - 2.4 * u, field.y - 3.6 * u, 2.4 * u, 7.2 * u);
    ctx.beginPath();
    ctx.arc(edge + side * -4.6 * u, field.y, 0.3 * u, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      edge - side * 4.6 * u,
      field.y,
      3.2 * u,
      side < 0 ? -0.65 : Math.PI - 0.65,
      side < 0 ? 0.65 : Math.PI + 0.65,
    );
    ctx.stroke();
    // goal with net
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(side < 0 ? edge - 1.6 : edge, field.y - 3.5, 1.6, 7);
    ctx.strokeStyle = "#9aa0a6";
    ctx.lineWidth = 0.08;
    for (let y = -3.5; y <= 3.5; y += 0.5) {
      ctx.beginPath();
      ctx.moveTo(side < 0 ? edge - 1.6 : edge, field.y + y);
      ctx.lineTo(side < 0 ? edge : edge + 1.6, field.y + y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#f7f7f2";
    ctx.lineWidth = 0.32 * u;
  }
  for (const [cx, cy, a0] of [
    [left, top, 0],
    [left + field.w, top, Math.PI / 2],
    [left + field.w, top + field.h, Math.PI],
    [left, top + field.h, -Math.PI / 2],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 0.9, a0, a0 + Math.PI / 2);
    ctx.stroke();
    ctx.fillStyle = "#f2c21b";
    ctx.beginPath();
    ctx.arc(cx, cy, 0.35, 0, 7);
    ctx.fill();
  }
}
