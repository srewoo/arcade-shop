import { COLORS } from "../mapPainter.js";
import { INK } from "../paintHelpers.js";
import { farmFields, parkingRects, footpaths, railway } from "../layoutSelect.js";
import { strokePolyline, roundRectPath } from "./canvasUtils.js";
import { paintParkedCar } from "./landmarks.js";

/** Crop fields: wheat (gold rows), corn (dashed green on soil) or vegetables (dotted rows). */
function paintCropFields(ctx) {
  for (const field of farmFields) {
    const left = field.x - field.w / 2;
    const top = field.y - field.h / 2;
    if (field.type === "wheat") {
      ctx.fillStyle = "#e3c15a";
      ctx.fillRect(left, top, field.w, field.h);
      ctx.strokeStyle = "#c69f3c";
      ctx.lineWidth = 0.35;
      for (let y = top + 1; y < top + field.h; y += 1.6) {
        ctx.beginPath();
        ctx.moveTo(left + 0.5, y);
        ctx.lineTo(left + field.w - 0.5, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "#f2d77c";
      ctx.lineWidth = 0.18;
      for (let y = top + 1.6; y < top + field.h; y += 1.6) {
        ctx.beginPath();
        ctx.moveTo(left + 0.5, y);
        ctx.lineTo(left + field.w - 0.5, y);
        ctx.stroke();
      }
      continue;
    }
    ctx.fillStyle = "#9b6a3e";
    ctx.fillRect(left, top, field.w, field.h);
    ctx.strokeStyle = "#7f5430";
    ctx.lineWidth = 0.4;
    if (field.type === "corn") {
      for (let y = top + 1; y < top + field.h; y += 1.6) {
        ctx.beginPath();
        ctx.moveTo(left + 0.4, y);
        ctx.lineTo(left + field.w - 0.4, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "#5aa83c";
      ctx.lineWidth = 0.55;
      for (let y = top + 1.8; y < top + field.h - 0.5; y += 1.6) {
        ctx.setLineDash([0.5, 0.4]);
        ctx.beginPath();
        ctx.moveTo(left + 0.8, y);
        ctx.lineTo(left + field.w - 0.8, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else {
      // vegetables: vertical furrows + dotted plants
      for (let x = left + 1; x < left + field.w; x += 1.8) {
        ctx.beginPath();
        ctx.moveTo(x, top + 0.4);
        ctx.lineTo(x, top + field.h - 0.4);
        ctx.stroke();
      }
      for (let x = left + 1.9; x < left + field.w - 0.5; x += 1.8) {
        for (let y = top + 1.2; y < top + field.h - 0.6; y += 1.5) {
          ctx.fillStyle = "#5dae45";
          ctx.beginPath();
          ctx.arc(x, y, 0.55, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#8fd06a";
          ctx.beginPath();
          ctx.arc(x - 0.12, y - 0.12, 0.25, 0, 7);
          ctx.fill();
        }
      }
    }
  }
}

const CAR_COLORS = ["#e8452f", "#3f70b8", "#f2c21b", "#f6f3ea", "#45a346", "#ef8ab0"];

/** Parking lots: diagonal bays, randomly parked cars (uses shared rng) and a blue "P" sign. */
function paintParkingLots(ctx, rng) {
  for (const lot of parkingRects) {
    const left = lot.x - lot.w / 2;
    const top = lot.y - lot.h / 2;
    ctx.fillStyle = COLORS.grassEdge;
    ctx.fillRect(left - 0.7, top - 0.7, lot.w + 1.4, lot.h + 1.4);
    ctx.fillStyle = "#7d8084";
    ctx.fillRect(left, top, lot.w, lot.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, lot.w, lot.h);
    ctx.clip();
    ctx.strokeStyle = COLORS.roadLine;
    ctx.lineWidth = 0.32;
    const rows = lot.h > 16 ? [top + 0.2, top + lot.h - 5.4] : [top + 0.2];
    for (const rowY of rows) {
      for (let x = left - 2; x <= left + lot.w + 2; x += 3.2) {
        ctx.beginPath();
        ctx.moveTo(x, rowY);
        ctx.lineTo(x + 2.4, rowY + 5.2);
        ctx.stroke();
      }
      for (let x = left + 0.4; x + 3.2 <= left + lot.w; x += 3.2) {
        if (rng() < 0.5) {
          paintParkedCar(ctx, x + 2.4, rowY + 2.6, Math.PI / 2 - 0.43, CAR_COLORS[Math.floor(rng() * 6)]);
        }
      }
    }
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.14;
    ctx.strokeRect(left, top, lot.w, lot.h);
    ctx.fillStyle = "#2f5ea8";
    roundRectPath(ctx, lot.x - 4.2, lot.y - 4.2, 8.4, 8.4, 1.2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.4;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "900 7px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P", lot.x, lot.y + 0.4);
  }
}

/** Crops, parking lots, yellow footpaths and the railway bed (ballast + sleepers). */
export function paintFieldsAndPaths(ctx, rng) {
  paintCropFields(ctx);
  paintParkingLots(ctx, rng);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const [color, width] of [
    [COLORS.pathEdge, 2],
    [COLORS.path, 1.5],
  ]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const path of footpaths) strokePolyline(ctx, path);
  }
  if (railway) {
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#b8a991";
    ctx.lineWidth = 4.6;
    strokePolyline(ctx, railway);
    ctx.strokeStyle = "#7a5232";
    ctx.lineWidth = 3.6;
    ctx.setLineDash([0.7, 1.1]);
    strokePolyline(ctx, railway);
    ctx.setLineDash([]);
  }
}
