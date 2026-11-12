/**
 * Race-route centerline for the "claude" (Grid City) base maps.
 * Original minified names: y2 (buildClaudeRoute), Ku (claudeRouteData).
 */
import { MAP } from "../config/maps.js";
import { ALPHA, CR, FILLET_DIST, FILLET_R, PHI, RING_R } from "./claude/claudeConfig.js";
import { TRACK as CLAUDE_BASE_TRACK } from "./claude/claudeTrack.js";
import { Turtle } from "./claude/Turtle.js";
import { claudeWarp } from "./claude/claudeWorld.js";
import { makeRouteFromPoints } from "./route.js";
import { resamplePolyline, smoothClosedPath } from "./solRoute.js";
import { warpPoint } from "./warp.js";

/**
 * Alternative hand-built closed routes ("outer" or the default west variant)
 * for Claude maps, drawn with the Turtle path builder (design-space units).
 * (y2)
 */
export function buildClaudeRoute(variant) {
  const t = new Turtle(-24, 52, 0);
  t.to(80 - CR, 52)
    .turn(CR, 90)
    .to(80, FILLET_DIST);
  if (variant === "outer") {
    t.turn(FILLET_R, -ALPHA)
      .turn(RING_R, 180 - 2 * PHI)
      .turn(FILLET_R, -ALPHA);
    t.to(80, -50 + CR)
      .turn(CR, 90)
      .to(-90 + CR, -50);
  } else {
    t.turn(FILLET_R, -ALPHA)
      .turn(RING_R, 270 - 2 * PHI)
      .turn(FILLET_R, -ALPHA);
    t.to(-10 + FILLET_DIST, 0);
    t.turn(FILLET_R, -ALPHA)
      .turn(RING_R, 90 - 2 * PHI)
      .turn(FILLET_R, -ALPHA);
    t.to(-10, -50 + CR)
      .turn(CR, 90)
      .to(-90 + CR, -50);
  }
  t.turn(CR, 90)
    .to(-90, 52 - CR)
    .turn(CR, 90)
    .to(-24, 52);
  return t.pts;
}

/**
 * Warped, resampled, smoothed route object for the Claude layout (reversed if the
 * map says so). Also evaluated (and ignored) for sol maps in the original.
 * (Ku)
 */
export const claudeRouteData = (() => {
  const basePoints = MAP.base === "claude" && claudeWarp.route ? buildClaudeRoute(claudeWarp.route) : CLAUDE_BASE_TRACK.pts;
  let pts = resamplePolyline(
    basePoints.map(([x, y]) => warpPoint(x, y)),
    0.5,
  );
  pts = smoothClosedPath(pts, 5, 2);
  pts = resamplePolyline(pts, 1);
  if (claudeWarp.reverse) pts.reverse();
  return makeRouteFromPoints(pts);
})();
