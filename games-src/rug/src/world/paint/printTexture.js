import { createCanvas, applyWorldTransform } from "./canvasUtils.js";
import { mulberry32 } from "../../util/math.js";
import { COLORS, MAP_TEX_WIDTH, MAP_TEX_HEIGHT } from "../mapPainter.js";
import { RUG, RUG_SHAPE } from "../layoutSelect.js";
import { withThemePalette, gradeCanvas, speckleSnow, blueprintCanvas, paintPersianGround, maskToShape } from "./restyle.js";
import { houses, trees } from "../houseLayout.js";
import { paintGround } from "./printGround.js";
import { paintFieldsAndPaths } from "./printFields.js";
import { paintRoadsAndRail } from "./printRoads.js";
import { paintRandomDecor } from "./printDecor.js";
import { paintBuildingOrLandmark } from "./buildings.js";
import { paintTree } from "./trees.js";

/**
 * Paint the whole top-down rug "print" (grass, ponds, pitch, crops, parking, paths, rail, roads,
 * decor, buildings, trees, border) onto a MAP_TEX_WIDTH x MAP_TEX_HEIGHT canvas.
 * `progress(p, label)` is the boot-loader callback (awaited so the loading bar can repaint).
 * `style` = {theme, pattern}: the default (classic playmat) takes exactly the original path, including the
 * shared mulberry32(4242) call order; other patterns paint with their own seeded RNGs (see restyle.js).
 * @returns {Promise<HTMLCanvasElement>} a copy of the print softened with blur(1.1px)
 */
export async function paintPrintTexture(progress, style = {}) {
  const { theme = "classic", pattern = "playmat" } = style;
  const canvas = await withThemePalette(theme, () => paintPlaymat(progress, pattern));
  const base = pattern === "blueprint" ? blueprintCanvas(canvas) : canvas;
  gradeCanvas(base, theme);
  if (theme === "winter") speckleSnow(base);
  const soft = createCanvas(MAP_TEX_WIDTH, MAP_TEX_HEIGHT);
  const softCtx = soft.getContext("2d");
  softCtx.filter = "blur(1.1px)";
  softCtx.drawImage(base, 0, 0);
  maskToShape(soft, RUG_SHAPE);
  return soft;
}

/** Paint the print for a pattern ("playmat" = the original painting). Returns the unsoftened canvas. */
async function paintPlaymat(progress, pattern) {
  const canvas = createCanvas(MAP_TEX_WIDTH, MAP_TEX_HEIGHT);
  const ctx = canvas.getContext("2d");
  const scale = applyWorldTransform(ctx, MAP_TEX_WIDTH);
  const rng = mulberry32(4242); // shared by every random decoration, call order matters
  const halfW = RUG.W / 2;
  const halfH = RUG.H / 2;
  const border = RUG.border;

  if (pattern === "persian") {
    paintPersianGround(ctx);
    paintRoadsAndRail(ctx);
    await progress(0.15, "print: roads");
  } else {
    paintGround(ctx, rng);
    await progress(0.1, "print: ponds, field");
    paintFieldsAndPaths(ctx, rng);
    await progress(0.12, "print: farm, parking");
    paintRoadsAndRail(ctx);
    paintRandomDecor(ctx, rng);
    await progress(0.15, "print: roads, decor");
    for (const building of houses) paintBuildingOrLandmark(ctx, building);
    for (const tree of trees) paintTree(ctx, tree);
  }

  // final border lines (transform reset to the same world mapping)
  ctx.setTransform(scale, 0, 0, scale, (RUG.W / 2) * scale, (RUG.H / 2) * scale);
  ctx.strokeStyle = COLORS.borderDark;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-halfW + 0.4, -halfH + 0.4, RUG.W - 0.8, RUG.H - 0.8);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 0.28;
  ctx.setLineDash([1.2, 0.9]);
  ctx.strokeRect(-halfW + 2.4, -halfH + 2.4, RUG.W - 4.8, RUG.H - 4.8);
  ctx.setLineDash([]);
  ctx.strokeStyle = "#f5f4ee";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-halfW + border - 0.25, -halfH + border - 0.25, RUG.W - border * 2 + 0.5, RUG.H - border * 2 + 0.5);
  await progress(0.17, "print: buildings");
  return canvas;
}
