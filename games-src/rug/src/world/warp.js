/**
 * Design-space -> world-space warp used by the "claude" (Grid City) base maps.
 * Design coordinates are scaled by CLAUDE_SCALE (1.2), displaced by a pair of
 * low-frequency sine waves (amplitude/frequency/phase from the map's `warp`),
 * then optionally mirrored in X. Roundabout centres are pinned (their local
 * offset is blended back toward the offset at the ring centre) so rings stay round.
 * Original minified names: Vd, wn, Ti, Ho, qi.
 */
import { smoothstepLayout } from "../util/mathLayout.js";
import { CLAUDE_SCALE, claudeWarp, scaledRoundabouts } from "./claude/claudeWorld.js";

/** Smooth sinusoidal displacement [dx, dz] at world-scaled (x, z). (Vd) */
export function baseWarpOffset(x, z) {
  const { a, f, p } = claudeWarp;
  return [
    a * (8 * Math.sin(z * 0.033 * f + 0.7 + p) + 4 * Math.sin((z * 0.071 + x * 0.02) * f + 2 + p)),
    a * (9 * Math.sin(x * 0.031 * f + 1.4 + p) + 5 * Math.sin((x * 0.067 + z * 0.024) * f + p)),
  ];
}

/** Warp a design-space point (x, y) -> world [x, z]. (wn) */
export function warpPoint(x, y) {
  const wx = x * CLAUDE_SCALE;
  const wy = y * CLAUDE_SCALE;
  let [dx, dz] = baseWarpOffset(wx, wy);
  for (const ring of scaledRoundabouts) {
    const weight = smoothstepLayout(30, 70, Math.hypot(wx - ring.x, wy - ring.y));
    const [ringDx, ringDz] = baseWarpOffset(ring.x, ring.y);
    dx = ringDx + (dx - ringDx) * weight;
    dz = ringDz + (dz - ringDz) * weight;
  }
  return [(wx + dx) * (claudeWarp.mirror ? -1 : 1), wy + dz];
}

/** {x, y} (design space) -> {x, z} (world). (Ti) */
export const warpPointObj = (p) => {
  const [x, z] = warpPoint(p.x, p.y);
  return { x, z };
};

/** Warp already world-scaled coordinates (inverse of the scale first). (Ho) */
export const warpWorld = (x, z) => warpPoint(x / CLAUDE_SCALE, z / CLAUDE_SCALE);

/** Warp an entity {x, z, ...} keeping the other fields. (qi) */
export const warpEntity = (entity) => {
  const [x, z] = warpWorld(entity.x, entity.z);
  return { ...entity, x, z };
};
