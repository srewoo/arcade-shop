import { COLORS } from "../mapPainter.js";
import { INK } from "../paintHelpers.js";
import { paintFacadeScaled, paintFlatRoof, paintGableRoof } from "../facadeTextures.js";
import { paintCastle, paintCarousel } from "./landmarks.js";

/** Height (in world units) of the front facade strip drawn below the roof. */
function facadeStripHeight(building) {
  return Math.min(4, building.h * 0.5);
}

/** Which side of the building faces the viewer, from its rotation. */
function buildingFacing(building) {
  const c = Math.cos(building.rot);
  const s = Math.sin(building.rot);
  return c > 0.5 ? "front" : c < -0.5 ? "back" : s > 0 ? "left" : "right";
}

/** Top-down roof + front facade sprite for house/shop/post/school/barn/hospital/fire/police. */
function paintBuilding(ctx, b) {
  const isCivic = ["shop", "hospital", "fire", "police"].includes(b.kind);
  const stripH = facadeStripHeight(b);
  const pad = isCivic ? 0 : 0.7;
  const art = b.art || 1;
  const facing = buildingFacing(b);
  const frontOrBack = facing === "front" || facing === "back";
  const faceW = frontOrBack ? b.w : b.d;
  const faceD = frontOrBack ? b.d : b.w;
  // drop shadow
  ctx.fillStyle = "rgba(20,40,15,0.22)";
  ctx.fillRect(b.x - faceW / 2 - pad + 0.8, b.y - faceD / 2 - pad + 0.8, faceW + pad * 2, faceD + pad * 2 + stripH);
  // facade strip
  ctx.save();
  ctx.translate(b.x, b.y);
  paintFacadeScaled(
    ctx,
    b,
    facing === "front" ? "front" : facing === "back" ? "back" : "side",
    -faceW / 2,
    faceD / 2,
    faceW,
    stripH,
    faceW / art,
    b.h / art,
  );
  if (facing === "front" && b.kind !== "shop") {
    ctx.fillStyle = COLORS.path;
    ctx.fillRect(-1.1, faceD / 2 + stripH, 2.2, 1.1);
  }
  ctx.restore();
  // roof
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(frontOrBack ? 0 : -Math.PI / 2);
  if (isCivic) {
    paintFlatRoof(ctx, b, b.w, b.d);
  } else {
    paintGableRoof(ctx, b.w + pad * 2, b.d + pad * 2, b.roof);
    if (b.chimney) {
      ctx.fillStyle = "#a4553a";
      ctx.fillRect(b.w * 0.22, -b.d * 0.36, 0.9 * art, 0.9 * art);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.1;
      ctx.strokeRect(b.w * 0.22, -b.d * 0.36, 0.9 * art, 0.9 * art);
    }
  }
  ctx.restore();
  // shop awning: 18 alternating stripes
  if (b.kind === "shop") {
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 2 ? b.accent : "#fff7e4";
      ctx.fillRect(b.x - b.w / 2 + (i * b.w) / 18, b.y + b.d / 2, b.w / 18, 1.2);
    }
  }
}

function paintMillSails(ctx, b) {
  paintBuilding(ctx, b);
  const cx = b.x + b.w / 2 + 2.6;
  const cy = b.y + b.d / 2 + 1;
  ctx.fillStyle = "#f6f3ea";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.arc(cx, cy, 3.9, 0, 7);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = i * 0.785;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 3.9, cy + Math.sin(a) * 3.9);
    ctx.stroke();
  }
}

function paintGasStation(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = "#8b8f95";
  ctx.fillRect(-b.w / 2 - 2, -b.d / 2 - 1.5, b.w + 4, b.d + 3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.14;
  ctx.strokeRect(-b.w / 2 - 2, -b.d / 2 - 1.5, b.w + 4, b.d + 3);
  ctx.fillStyle = "rgba(20,40,15,0.22)";
  ctx.fillRect(-b.w / 2 + 1, -b.d / 2 + 1, b.w, b.d);
  ctx.fillStyle = b.accent;
  ctx.fillRect(-b.w / 2, -b.d / 2, b.w, b.d);
  ctx.fillStyle = b.roof;
  ctx.fillRect(-b.w / 2 + 0.7, -b.d / 2 + 0.7, b.w - 1.4, b.d - 1.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.16;
  ctx.strokeRect(-b.w / 2, -b.d / 2, b.w, b.d);
  ctx.fillStyle = b.accent;
  ctx.font = '900 3.6px "Arial Rounded MT Bold", "Arial Black", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAS", 0, 0.3);
  ctx.restore();
}

function paintSilo(ctx, b) {
  ctx.fillStyle = "rgba(20,40,15,0.22)";
  ctx.beginPath();
  ctx.arc(b.x + 1, b.y + 1, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = b.wall;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = b.roof;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.16;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.stroke();
}

function paintFountain(ctx, b) {
  ctx.fillStyle = "#c9ccd1";
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, 7);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.14;
  ctx.stroke();
  ctx.fillStyle = COLORS.water;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 0.76, 0, 7);
  ctx.fill();
  ctx.fillStyle = COLORS.waterLight;
  ctx.beginPath();
  ctx.arc(b.x - 0.5, b.y - 0.5, b.r * 0.4, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#f2f6fa";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283;
    ctx.beginPath();
    ctx.arc(b.x + Math.cos(a) * 1.2, b.y + Math.sin(a) * 1.2, 0.28, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "#c9ccd1";
  ctx.beginPath();
  ctx.arc(b.x, b.y, 0.6, 0, 7);
  ctx.fill();
  ctx.stroke();
}

/** Football grandstand seen from above: four blue bands. */
function paintStand(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = "rgba(20,40,15,0.2)";
  ctx.fillRect(-b.w / 2 + 0.6, -b.d / 2 + 0.6, b.w, b.d);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? "#3f70b8" : "#5b8bd0";
    ctx.fillRect(-b.w / 2, -b.d / 2 + (i * b.d) / 4, b.w, b.d / 4);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.15;
  ctx.strokeRect(-b.w / 2, -b.d / 2, b.w, b.d);
  ctx.restore();
}

/** Dispatch on `kind` and paint a building or landmark onto the print canvas. */
export function paintBuildingOrLandmark(ctx, b) {
  switch (b.kind) {
    case "house":
    case "shop":
    case "post":
    case "school":
    case "barn":
    case "hospital":
    case "fire":
    case "police":
      return paintBuilding(ctx, b);
    case "mill":
      return paintMillSails(ctx, b);
    case "gas":
      return paintGasStation(ctx, b);
    case "silo":
      return paintSilo(ctx, b);
    case "fountain":
      return paintFountain(ctx, b);
    case "castle":
      return paintCastle(ctx, b);
    case "carousel":
      return paintCarousel(ctx, b);
    case "stand":
      return paintStand(ctx, b);
  }
}
