import { shadeColor } from "../../util/color.js";
import { COLORS } from "../mapPainter.js";
import {
  roadWidth,
  roundaboutRadius,
  roads,
  roundabouts,
  junctionPoints,
  junctionDiscs,
  zebraCrossings,
  railway,
} from "../layoutSelect.js";
import { fenceSegments } from "../houseLayout.js";
import { strokePolyline, roundRectPath } from "./canvasUtils.js";

/** One road layer: all road polylines, roundabout rings and junction dots in a given width/colour. */
function strokeRoadLayer(ctx, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.fillStyle = color;
  for (const road of roads) strokePolyline(ctx, road.pts);
  for (const rb of roundabouts) {
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, roundaboutRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const [x, y] of junctionPoints) {
    ctx.beginPath();
    ctx.arc(x, y, width / 2 + 1.4, 0, 7);
    ctx.fill();
  }
}

function paintRoundaboutCentres(ctx) {
  for (const rb of roundabouts) {
    ctx.fillStyle = COLORS.roadLine;
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, roundaboutRadius - 6.2, 0, 7);
    ctx.fill();
    ctx.fillStyle = COLORS.grassEdge;
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, roundaboutRadius - 6.8, 0, 7);
    ctx.fill();
    ctx.fillStyle = COLORS.grass;
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, roundaboutRadius - 7.4, 0, 7);
    ctx.fill();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      ctx.fillStyle = ["#e8452f", "#f6d23a", "#f39ab8"][i % 3];
      ctx.beginPath();
      ctx.arc(
        rb.x + Math.cos(a) * (roundaboutRadius - 8.5),
        rb.y + Math.sin(a) * (roundaboutRadius - 8.5),
        0.34,
        0,
        7,
      );
      ctx.fill();
    }
    ctx.strokeStyle = COLORS.roadLine;
    ctx.lineWidth = 0.4;
    ctx.setLineDash([2.4, 2.2]);
    ctx.beginPath();
    ctx.arc(rb.x, rb.y, roundaboutRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** Dashed centre lines: 5.5 period, first 3 units drawn, skipped inside junction/roundabout discs. */
function paintDashedCentreLines(ctx) {
  ctx.strokeStyle = COLORS.roadLine;
  ctx.lineWidth = 0.45;
  ctx.lineCap = "butt";
  const inJunction = (x, y) => junctionDiscs.some((d) => (x - d.x) ** 2 + (y - d.y) ** 2 < d.r * d.r);
  for (const road of roads) {
    if (!road.dashed) continue;
    let travelled = 0;
    for (let i = 0; i < road.pts.length - 1; i++) {
      const p0 = road.pts[i];
      const p1 = road.pts[i + 1];
      const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const steps = Math.ceil(length / 0.25);
      for (let k = 0; k < steps; k++) {
        const t0 = k / steps;
        const t1 = (k + 1) / steps;
        const phase = (travelled + length * t0) % 5.5;
        const x = p0[0] + (p1[0] - p0[0]) * t0;
        const y = p0[1] + (p1[1] - p0[1]) * t0;
        if (phase < 3 && !inJunction(x, y)) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1);
          ctx.stroke();
        }
      }
      travelled += length;
    }
  }
}

function paintZebraCrossings(ctx) {
  for (const zebra of zebraCrossings) {
    ctx.save();
    ctx.translate(zebra.x, zebra.y);
    ctx.rotate(zebra.a);
    ctx.fillStyle = COLORS.roadLine;
    for (let i = -3; i <= 3; i++) ctx.fillRect(-2, i * 1.9 - 0.55, 4, 1.1);
    ctx.restore();
  }
}

/** Rails (offset +-1.1 from the bed centre line) and three train cars. */
function paintRailsAndTrain(ctx) {
  ctx.strokeStyle = "#6d6f73";
  ctx.lineWidth = 0.35;
  ctx.lineCap = "butt";
  for (const side of [-1, 1]) {
    strokePolyline(
      ctx,
      railway.map(([x, y], i) => {
        const prev = railway[Math.max(0, i - 1)];
        const next = railway[Math.min(railway.length - 1, i + 1)];
        const len = Math.hypot(next[0] - prev[0], next[1] - prev[1]) || 1;
        return [x - ((next[1] - prev[1]) / len) * side * 1.1, y + ((next[0] - prev[0]) / len) * side * 1.1];
      }),
    );
  }
  for (let i = 0; i < 3; i++) {
    const idx = 22 + i * 4;
    const [x, y] = railway[idx];
    const [nx, ny] = railway[idx + 1];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(ny - y, nx - x));
    ctx.fillStyle = i === 0 ? "#d8302a" : "#2f5ea8"; // RE: first car is the red locomotive
    roundRectPath(ctx, -3.6, -1.7, 7.2, 3.4, 0.6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(-2.8, -1.2, 5.6, 0.7);
    ctx.restore();
  }
}

function paintFences(ctx) {
  for (const fence of fenceSegments) {
    ctx.strokeStyle = fence.color;
    ctx.lineWidth = 0.22;
    ctx.beginPath();
    ctx.moveTo(fence.a[0], fence.a[1]);
    ctx.lineTo(fence.b[0], fence.b[1]);
    ctx.stroke();
    const length = Math.hypot(fence.b[0] - fence.a[0], fence.b[1] - fence.a[1]);
    ctx.fillStyle = shadeColor(fence.color.length === 7 ? fence.color : "#8a5a33", -0.25);
    for (let d = 0; d <= length; d += 1.5) {
      const x = fence.a[0] + ((fence.b[0] - fence.a[0]) * d) / length;
      const y = fence.a[1] + ((fence.b[1] - fence.a[1]) * d) / length;
      ctx.fillRect(x - 0.2, y - 0.2, 0.4, 0.4);
    }
  }
}

/** Roads (4 stacked layers), roundabout centres, dashed lines, zebras, rails, train, fences. */
export function paintRoadsAndRail(ctx) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  strokeRoadLayer(ctx, roadWidth + 1.5, COLORS.grassEdge);
  strokeRoadLayer(ctx, roadWidth, COLORS.road);
  strokeRoadLayer(ctx, roadWidth - 0.7, COLORS.roadLine);
  strokeRoadLayer(ctx, roadWidth - 1.4, COLORS.road);
  paintRoundaboutCentres(ctx);
  paintDashedCentreLines(ctx);
  paintZebraCrossings(ctx);
  if (railway) paintRailsAndTrain(ctx);
  paintFences(ctx);
}
