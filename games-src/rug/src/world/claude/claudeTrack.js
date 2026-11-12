// Grid City race track centreline: a rectangle with a figure-eight crossing through two roundabouts.
import { Turtle } from "./Turtle.js";
import { CR, FILLET_DIST, FILLET_R, ALPHA, RING_R, PHI } from "./claudeConfig.js";

function buildTrack() {
  const t = new Turtle(-24, 52, 0);
  t.to(80 - CR, 52).turn(CR, 90);
  t.to(80, FILLET_DIST);
  t.turn(FILLET_R, -ALPHA)
    .turn(RING_R, 180 - 2 * PHI)
    .turn(FILLET_R, -ALPHA);
  t.to(80, -50 + CR).turn(CR, 90);
  t.to(-10 + CR, -50).turn(CR, 90);
  t.to(-10, -FILLET_DIST);
  t.turn(FILLET_R, -ALPHA)
    .turn(RING_R, 90 - 2 * PHI)
    .turn(FILLET_R, -ALPHA);
  t.to(-90 + CR, 0).turn(CR, 90);
  t.to(-90, 52 - CR).turn(CR, 90);
  t.to(-24, 52);
  const pts = t.pts;
  const last = pts[pts.length - 1];
  // Drop the duplicated closing point if the loop closed.
  if (Math.hypot(last[0] - pts[0][0], last[1] - pts[0][1]) < 0.3) pts.pop();
  return { pts, turns: t.turns };
}

/** {pts: [[x,y]...], turns: [[startIdx,endIdx,deg]...]} */
export const TRACK = buildTrack();
