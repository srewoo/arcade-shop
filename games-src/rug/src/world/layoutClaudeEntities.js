/**
 * Claude (Grid City) layout, part 2: houses, trees, fences, ducks and reeds,
 * filtered so nothing sits in the ball zone or under the sofa.
 * Original minified names in parentheses.
 */
import { mulberry32Signed } from "../util/math.js";
import { BUILDINGS } from "./claude/claudeBuildings.js";
import { CLAUDE_GD, CLAUDE_SCALE, CLAUDE_X2, claudeWarp } from "./claude/claudeWorld.js";
import { FARM_FIELDS } from "./claude/claudeScenery.js";
import { FENCES } from "./claude/claudeFences.js";
import { TREES } from "./claude/claudeTrees.js";
import {
  generatedLayout,
  insideBallZone,
  insideSofaLeg,
  pondsClaude,
} from "./layoutClaudeBase.js";
import { warpEntity, warpPoint, warpPointObj, warpWorld } from "./warp.js";

/** Per-kind art scale factors for fixed-layout buildings. (B2) */
export const ART_SCALE_BY_KIND = { hospital: 1, gas: 1.05, barn: 1.1 };

/** Buildings: generated houses (kept unless in ball zone), or the fixed list scaled. (H2) */
export const housesClaude = generatedLayout
  ? generatedLayout.houses
      .map(warpEntity)
      .filter((h) => h.kind === "stand" || !insideBallZone(h.x, h.z, (h.w ?? h.r * 2) / 2))
      .map((h) => ({ ...h, y: h.z }))
  : BUILDINGS.map((b, i) => {
      const p = warpPointObj(b);
      const art = ART_SCALE_BY_KIND[b.kind] ?? CLAUDE_X2;
      const house = { ...b, x: p.x, y: p.z, z: p.z, ready: true, art, seed: b.seed ?? 3e3 + i * 41 };
      if (b.w) house.w = b.w * art;
      if (b.d) house.d = b.d * art;
      if (b.r) house.r = b.r * 1.35;
      if (b.h) house.h = b.h * CLAUDE_GD;
      if (b.roofH) house.roofH = b.roofH * CLAUDE_GD;
      if (b.kind === "stand") {
        house.w = b.w * CLAUDE_SCALE;
        house.d = 5;
        house.h = 4;
      }
      return house;
    }).filter((h) => h.kind === "stand" || !insideBallZone(h.x, h.y, (h.w ?? h.r * 2) / 2));

/** Trees (round or pine), away from ball zone and sofa legs. (G2) */
export const treesClaude = (
  generatedLayout
    ? generatedLayout.trees.map(warpEntity)
    : TREES.map((tree) => {
        const p = warpPointObj(tree);
        const r = tree.r * 1.5;
        return { x: p.x, z: p.z, r, h: r * 2.7, kind: tree.pine ? "pine" : "round", shade: tree.hue };
      })
).filter((t) => !insideBallZone(t.x, t.z, t.r) && !insideSofaLeg(t.x, t.z, t.r));

/** Farm field containing the design-space point (with 2 units margin). (V2) */
const findFarmFieldAt = (x, y) =>
  FARM_FIELDS.find((f) => Math.abs(x - f.x) < f.w / 2 + 2 && Math.abs(y - f.y) < f.h / 2 + 2);

/** Warp a fence end point; points inside a farm field keep the field's local scale. (Wd) */
const warpWithFarm = ([x, y]) => {
  const field = findFarmFieldAt(x, y);
  if (!field) return warpPoint(x, y);
  const [fx, fz] = warpPoint(field.x, field.y);
  return [fx + (x - field.x) * CLAUDE_SCALE * (claudeWarp.mirror ? -1 : 1), fz + (y - field.y) * CLAUDE_SCALE];
};

/** Fence segments {x1,z1,x2,z2,color?}. (W2) */
export const fencesClaude = generatedLayout
  ? generatedLayout.fences.map((fence) => {
      const [x1, z1] = warpWorld(fence.x1, fence.z1);
      const [x2, z2] = warpWorld(fence.x2, fence.z2);
      return { x1, z1, x2, z2 };
    })
  : FENCES.map((fence) => {
      const [x1, z1] = warpWithFarm(fence.a);
      const [x2, z2] = warpWithFarm(fence.b);
      return { x1, z1, x2, z2, color: fence.color };
    });

/** Duck positions on ponds. (X2) */
export const ducksClaude = generatedLayout
  ? generatedLayout.ducks.map(warpEntity)
  : pondsClaude.map((pond) => ({ x: pond.x + pond.rx * 0.2, z: pond.z + pond.rz * 0.25 }));

/** Reed clumps around ponds (26 per pond, seeded 177 + pond index). (L0) */
export const reedsClaude = generatedLayout ? generatedLayout.reeds.map(warpEntity) : [];
if (!generatedLayout) {
  pondsClaude.forEach((pond, i) => {
    const rng = mulberry32Signed(177 + i);
    for (let k = 0; k < 26; k++) {
      const angle = rng() * Math.PI * 2;
      reedsClaude.push({
        x: pond.x + Math.cos(angle) * (pond.rx - 0.5),
        z: pond.z + Math.sin(angle) * (pond.rz - 0.5),
        h: 2 + rng() * 2.4,
      });
    }
  });
}
