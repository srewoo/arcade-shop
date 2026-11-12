/**
 * Procedural facade / roof textures for buildings, painted on 2D canvases in "world unit"
 * coordinates (1 unit = 1 canvas unit; the caller applies a scale transform).
 * Original minified names in parentheses.
 */
import { shadeColor } from "../util/color.js";
import {
  DOOR_BROWN,
  INK,
  WINDOW_BLUE,
  WINDOW_SHINE,
  drawClock,
  drawDoor,
  drawEnvelope,
  drawRedCross,
  drawSign,
  drawWindow,
  fillRectOutlined,
} from "./paintHelpers.js";

const LINE = 0.11; // outline width used on facades

/** Door + signage on a front facade for the "else" building kinds (house, hospital, police, post, school). */
function paintFrontDoorAndSign(ctx, house, w, h, cx, rowYs, colXs, winW, winH) {
  const doorW = house.kind === "hospital" || house.kind === "school" ? 1.8 : 1.25;
  for (const y of rowYs) {
    for (const x of colXs) {
      if (Math.abs(x - cx) < doorW * 0.5 + 0.8 && y === rowYs[rowYs.length - 1]) continue;
      drawWindow(ctx, x, y, winW, winH, LINE);
    }
  }
  drawDoor(
    ctx,
    cx,
    h - 0.45,
    doorW,
    Math.min(2.2, h * 0.45),
    LINE,
    house.kind === "hospital" || house.kind === "police" ? "#4f95d8" : DOOR_BROWN,
  );
  if (house.kind === "hospital") {
    drawRedCross(ctx, cx, h * 0.27, 1.2, LINE);
    drawSign(ctx, cx - 4.2, h * 0.27, "HOSPITAL", "#ffffff", "#e02a2a", 4.6, 0.9, LINE);
  } else if (house.kind === "police") {
    drawSign(ctx, cx, h * 0.2, "POLICE", "#ffffff", "#2f5ea8", Math.min(w * 0.6, 5), 0.95, LINE);
  } else if (house.kind === "post") {
    drawEnvelope(ctx, cx, h * 0.24, 1, LINE);
  } else if (house.kind === "school") {
    drawClock(ctx, cx, h * 0.24, 0.6, LINE);
    drawSign(ctx, cx + w * 0.28, h * 0.24, "SCHOOL", "#ffffff", "#c23b2b", 4.2, 0.85, LINE);
  }
}

/** Shop front: 5 bays (middle one is the door) and a "SHOP" sign. */
function paintShopFront(ctx, house, w, h, cx) {
  for (let i = 0; i < 5; i++) {
    const x = ((i + 0.5) * w) / 5;
    if (i === 2) {
      drawDoor(ctx, x, h - 0.45, 2.4, h * 0.52, LINE, "#4f95d8");
      continue;
    }
    fillRectOutlined(ctx, x - w * 0.08, h * 0.38, w * 0.16, h * 0.44, WINDOW_BLUE, LINE);
    ctx.fillStyle = WINDOW_SHINE;
    ctx.fillRect(x - w * 0.07, h * 0.42, w * 0.05, h * 0.12);
  }
  drawSign(ctx, cx, h * 0.17, "SHOP", house.accent, "#ffffff", w * 0.34, h * 0.2, LINE);
}

/** Fire station front: two roller doors with slats and a "FIRE" sign. */
function paintFireFront(ctx, w, h, cx) {
  for (const x of [w * 0.28, w * 0.72]) {
    fillRectOutlined(ctx, x - w * 0.17, h * 0.32, w * 0.34, h * 0.68 - 0.45, "#eef0f2", LINE);
    ctx.strokeStyle = "#9aa1aa";
    ctx.lineWidth = 0.08;
    for (let i = 1; i < 6; i++) {
      const y = h * 0.32 + (i * (h * 0.68 - 0.45)) / 6;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.17, y);
      ctx.lineTo(x + w * 0.17, y);
      ctx.stroke();
    }
  }
  drawSign(ctx, cx, h * 0.17, "FIRE", "#f6f3ea", "#d8302a", Math.min(w * 0.5, 4.5), 1, LINE);
}

/** Barn front: big white-framed door with a cross brace and a hayloft window. */
function paintBarnFront(ctx, house, h, cx) {
  fillRectOutlined(ctx, cx - 1.4, h - 0.45 - 2.9, 2.8, 2.9, "#f6f3ea", LINE);
  fillRectOutlined(ctx, cx - 1.15, h - 0.45 - 2.65, 2.3, 2.65, house.wall, LINE * 0.6);
  ctx.strokeStyle = "#f6f3ea";
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - 1.15, h - 3.1);
  ctx.lineTo(cx + 1.15, h - 0.45);
  ctx.moveTo(cx + 1.15, h - 3.1);
  ctx.lineTo(cx - 1.15, h - 0.45);
  ctx.stroke();
  drawWindow(ctx, cx, h * 0.22, 0.9, 0.8, LINE);
}

/**
 * Paint a wall of size w x h. `side` is "front" | "side" | "back".
 * Kinds: shop, fire, barn, hospital, police, post, school, generic house. (X0)
 */
export function paintFacade(ctx, house, side, w, h) {
  const wall = house.wall || "#f6f1e6";
  fillRectOutlined(ctx, 0, 0, w, h, wall);
  ctx.fillStyle = shadeColor(wall, -0.3);
  ctx.fillRect(0, h - 0.45, w, 0.45); // skirting
  if (house.kind === "hospital") {
    ctx.fillStyle = "#e02a2a";
    ctx.fillRect(0, 0.25, w, 0.35);
  }
  if (house.kind === "police") {
    ctx.fillStyle = "#2f5ea8";
    ctx.fillRect(0, 0.25, w, 0.5);
    ctx.fillRect(0, h - 1, w, 0.55);
  }
  if (house.kind === "fire") {
    ctx.fillStyle = "#f6f3ea";
    ctx.fillRect(0, 0.3, w, 0.3);
  }
  const twoRows = h > 5.6;
  const winW = 1.05;
  const winH = twoRows ? 1 : 1.2;
  const rowYs = twoRows ? [h * 0.34, h * 0.66] : [h * 0.5];
  const cols = Math.max(1, Math.floor((w - 0.8) / 2.2));
  const colXs = [];
  for (let i = 0; i < cols; i++) colXs.push(((i + 0.5) * w) / cols);
  if (side === "front") {
    const cx = w / 2;
    if (house.kind === "shop") paintShopFront(ctx, house, w, h, cx);
    else if (house.kind === "fire") paintFireFront(ctx, w, h, cx);
    else if (house.kind === "barn") paintBarnFront(ctx, house, h, cx);
    else paintFrontDoorAndSign(ctx, house, w, h, cx, rowYs, colXs, winW, winH);
  } else {
    const sideCols = side === "side" ? Math.max(1, Math.floor((w - 0.6) / 2.4)) : cols;
    for (const y of rowYs) for (let i = 0; i < sideCols; i++) drawWindow(ctx, ((i + 0.5) * w) / sideCols, y, winW, winH, LINE);
  }
  ctx.lineWidth = LINE * 1.3;
  ctx.strokeStyle = INK;
  ctx.strokeRect(0, 0, w, h);
}

/** Paint a facade of design size (srcW x srcH) scaled into a (dstW x dstH) area at (x, y). (oS) */
export function paintFacadeScaled(ctx, house, side, x, y, dstW, dstH, srcW, srcH) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dstW / srcW, dstH / srcH);
  paintFacade(ctx, house, side, srcW, srcH);
  ctx.restore();
}

/** Gable roof: two shingle halves meeting at a ridge, centred on the origin. (aS) */
export function paintGableRoof(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h / 2);
  ctx.fillStyle = shadeColor(color, -0.18);
  ctx.fillRect(-w / 2, 0, w, h / 2);
  ctx.strokeStyle = shadeColor(color, -0.42);
  ctx.lineWidth = 0.1;
  for (let y = -h / 2 + 0.6; y < h / 2 - 0.1; y += 0.66) {
    ctx.beginPath();
    for (let x = -w / 2; x < w / 2; x += 0.66) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 0.33, y + (y < 0 ? 0.28 : -0.28), x + 0.66, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.18;
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.stroke();
  ctx.strokeRect(-w / 2, -h / 2, w, h);
}

/** Flat roof with vents and a letter marking (H for hospital, P police, FIRE). (q0) */
export function paintFlatRoof(ctx, house, w, h) {
  const roof = house.roof;
  ctx.fillStyle = shadeColor(roof, -0.15);
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = roof;
  ctx.fillRect(-w / 2 + 0.6, -h / 2 + 0.6, w - 1.2, h - 1.2);
  ctx.fillStyle = shadeColor(roof, -0.3);
  ctx.fillRect(-w / 2 + 1.2, -h / 2 + 1.2, 1.8, 1.3);
  ctx.fillRect(w / 2 - 3, -h / 2 + 1.2, 1.8, 1.3);
  const size = Math.min(h * 0.55, 4.5);
  const letter = (text, fontScale, color, y) => {
    ctx.fillStyle = color;
    ctx.font = `900 ${size * fontScale}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, y);
  };
  if (house.kind === "hospital") {
    fillRectOutlined(ctx, -size / 2, -size / 2, size, size, "#e02a2a", 0.14);
    letter("H", 0.8, "#ffffff", size * 0.05);
    drawRedCross(ctx, -w / 4, 0, size * 0.7, 0.12);
  } else if (house.kind === "police") {
    fillRectOutlined(ctx, -size / 2, -size / 2, size, size, "#2f5ea8", 0.14);
    letter("P", 0.8, "#ffffff", size * 0.05);
  } else if (house.kind === "fire") {
    letter("FIRE", 0.55, "#d8302a", size * 0.05);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.18;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
}
