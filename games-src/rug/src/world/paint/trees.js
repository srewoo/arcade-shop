import { COLORS } from "../mapPainter.js";
import { INK } from "../paintHelpers.js";
import { mulberry32 } from "../../util/math.js";

/** Painted tree canopy (dS): pine = 3 spiky star layers; otherwise a bumpy blob with highlights. */
export function paintTree(ctx, tree) {
  const rng = mulberry32(tree.seed);
  ctx.fillStyle = "rgba(15,40,10,0.24)";
  ctx.beginPath();
  ctx.arc(tree.x + tree.r * 0.35, tree.y + tree.r * 0.35, tree.r * 1.02, 0, Math.PI * 2);
  ctx.fill();
  if (tree.pine) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const rad = i % 2 ? (tree.r + 0.18) * 0.74 : tree.r + 0.18;
      const px = tree.x + Math.cos(a) * rad;
      const py = tree.y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = tree.r * (1 - layer * 0.28);
      ctx.fillStyle = [COLORS.pine, "#2e8556", "#46a06a"][layer];
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2 + layer * 0.3;
        const rad = i % 2 ? layerRadius * 0.72 : layerRadius;
        const px = tree.x + Math.cos(a) * rad;
        const py = tree.y + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#7a4a26";
    ctx.beginPath();
    ctx.arc(tree.x, tree.y, tree.r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const lobes = 8;
  const phase = rng();
  const lobe = (a, extra) => {
    ctx.beginPath();
    ctx.arc(
      tree.x + Math.cos(a) * tree.r * 0.62,
      tree.y + Math.sin(a) * tree.r * 0.62,
      tree.r * 0.4 + extra,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  };
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(tree.x, tree.y, tree.r * 0.86 + 0.16, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < lobes; i++) lobe((i / lobes) * Math.PI * 2 + phase, 0.16);
  ctx.fillStyle = COLORS.tree;
  ctx.beginPath();
  ctx.arc(tree.x, tree.y, tree.r * 0.86, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < lobes; i++) lobe((i / lobes) * Math.PI * 2 + phase, 0);
  ctx.fillStyle = COLORS.treeMid;
  ctx.beginPath();
  ctx.arc(tree.x - tree.r * 0.1, tree.y - tree.r * 0.1, tree.r * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.treeLight;
  ctx.beginPath();
  ctx.arc(tree.x - tree.r * 0.3, tree.y - tree.r * 0.3, tree.r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(tree.x - tree.r * 0.38, tree.y - tree.r * 0.4, tree.r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}
