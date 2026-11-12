/**
 * Small 2D-canvas drawing helpers (cartoon windows, doors, signs, icons) used to paint
 * building facades. Colours are shared constants. Original minified names in parentheses.
 */

export const INK = "#2a2420"; // outline colour (We)
export const WINDOW_BLUE = "#3f8ad6"; // (H0)
export const WINDOW_SHINE = "#9fd5f6"; // (G0)
export const TRIM_WHITE = "#fbf8ef"; // (su)
export const DOOR_BROWN = "#8b4a2b"; // (V0)

/** Fill a rectangle and optionally outline it with `lineWidth`. (Mn) */
export function fillRectOutlined(ctx, x, y, w, h, fill, lineWidth) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = INK;
    ctx.strokeRect(x, y, w, h);
  }
}

/** Window centred at (cx, cy) with white frame, blue glass, a shine wedge and cross bars. (Fc) */
export function drawWindow(ctx, cx, cy, w, h, lineWidth) {
  fillRectOutlined(ctx, cx - w / 2 - 0.12, cy - h / 2 - 0.12, w + 0.24, h + 0.24, TRIM_WHITE, lineWidth);
  fillRectOutlined(ctx, cx - w / 2, cy - h / 2, w, h, WINDOW_BLUE, lineWidth * 0.7);
  ctx.fillStyle = WINDOW_SHINE;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy + h * 0.1);
  ctx.lineTo(cx - w / 2 + w * 0.45, cy - h / 2);
  ctx.lineTo(cx - w / 2 + w * 0.7, cy - h / 2);
  ctx.lineTo(cx - w / 2, cy + h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = TRIM_WHITE;
  ctx.fillRect(cx - 0.05, cy - h / 2, 0.1, h);
  ctx.fillRect(cx - w / 2, cy - 0.05, w, 0.1);
}

/** Door whose bottom edge sits at y (centre x), with a yellow knob. (qd) */
export function drawDoor(ctx, cx, bottomY, w, h, lineWidth, color = DOOR_BROWN) {
  fillRectOutlined(ctx, cx - w / 2 - 0.15, bottomY - h - 0.15, w + 0.3, h + 0.15, TRIM_WHITE, lineWidth);
  fillRectOutlined(ctx, cx - w / 2, bottomY - h, w, h, color, lineWidth);
  ctx.fillStyle = "#f2c21b";
  ctx.beginPath();
  ctx.arc(cx + w * 0.3, bottomY - h * 0.45, 0.09, 0, 7);
  ctx.fill();
}

/** Sign plate with centred, auto-fitted text. (ho) */
export function drawSign(ctx, cx, cy, text, plateColor, textColor, w, h, lineWidth) {
  // RE: argument order follows the original (n,t,e,i,s,r,o,a,l): text is 4th, plate colour 5th, text colour 6th.
  fillRectOutlined(ctx, cx - w / 2, cy - h / 2, w, h, plateColor, lineWidth);
  ctx.fillStyle = textColor;
  ctx.font = `900 ${h * 0.72}px "Arial Rounded MT Bold", "Arial Black", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + h * 0.05, w * 0.92);
}

/** White square with a red cross (hospital). (W0) */
export function drawRedCross(ctx, cx, cy, size, lineWidth) {
  fillRectOutlined(ctx, cx - size / 2, cy - size / 2, size, size, "#ffffff", lineWidth);
  ctx.fillStyle = "#e02a2a";
  ctx.fillRect(cx - size * 0.12, cy - size * 0.36, size * 0.24, size * 0.72);
  ctx.fillRect(cx - size * 0.36, cy - size * 0.12, size * 0.72, size * 0.24);
}

/** Envelope icon (post office). (sS) */
export function drawEnvelope(ctx, cx, cy, size, lineWidth) {
  fillRectOutlined(ctx, cx - size * 0.6, cy - size * 0.4, size * 1.2, size * 0.8, "#ffffff", lineWidth);
  ctx.strokeStyle = INK;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.6, cy - size * 0.4);
  ctx.lineTo(cx, cy + size * 0.05);
  ctx.lineTo(cx + size * 0.6, cy - size * 0.4);
  ctx.stroke();
}

/** Clock face icon (school). (rS) */
export function drawClock(ctx, cx, cy, radius, lineWidth) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 7);
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - radius * 0.7);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + radius * 0.5, cy);
  ctx.stroke();
}
