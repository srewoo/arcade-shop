/**
 * Chooses the active layout namespace (Claude "Grid City" family vs the "sol" living-room
 * family) and exposes its parts under shared names used by the rest of the game.
 * Original minified names in parentheses.
 */
import { MAP } from "../config/maps.js";
import { CLAUDE_LAYOUT } from "./layoutClaude.js";
import { solLayoutModule } from "./sol/solArrange.js";
import { GRID_SLOTS } from "./solTrack.js";
import { SHAPES } from "../logic/shapeRoutes.js";


/** Active layout namespace. (Un) */
export const LAYOUT = MAP.base === "claude" ? CLAUDE_LAYOUT : solLayoutModule;

export const HALF_W = LAYOUT.HX; // (I0)
export const HALF_H = LAYOUT.HZ; // (D0)
export const ROAD_WIDTH = LAYOUT.ROAD; // (Ul)
export const ROUNDABOUT_RADIUS = LAYOUT.RB_R; // (U0)
export const warpLayout = LAYOUT.warp; // (zc)
/** Route object (n, x, z, tx, tz, curv, at(), nearestGlobal(), ...). (ne) */
export const route = LAYOUT.route;
export const ponds = LAYOUT.ponds; // (N0)
export const fields = LAYOUT.fields; // (ka)
export const parkingLots = LAYOUT.parking; // (Y2)
export const ducks = LAYOUT.ducks; // ($2)
export const reeds = LAYOUT.reeds; // (Xd)
export const BRICK_H = LAYOUT.BRICK_H; // (z0)
export const bricks = LAYOUT.bricks; // (eu)
export const sofaLegs = LAYOUT.sofaLegs; // (hl)
export const ball = LAYOUT.BALL; // (xn)
export const catCrossings = LAYOUT.CAT_CROSSINGS; // (Ur)
export const junctionPoints = LAYOUT.JUNCTION_POINTS; // (ju)
export const sofaBottom = LAYOUT.SOFA_BOTTOM; // (es)
export const farmFields = LAYOUT.FARM_FIELDS; // (Nl)
export const footpaths = LAYOUT.PATHS; // (F0)

/** Clip shape of the rug ({kind:"ellipse"|"band"}) for shaped maps, else null. */
export const RUG_SHAPE = MAP.shape ? SHAPES[MAP.shape] : null;

/** Four start-grid slots {s, lat}. (nu) */
export const STARTING_GRID = GRID_SLOTS;
/** Railway polyline or null. (Bn) */
export const railway = LAYOUT.RAILWAY ?? null;
/** Rug dimensions in world units (width, depth) and border. (wt) */
export const RUG = { W: HALF_W * 2, H: HALF_H * 2, border: 2.4 };
export const roadWidth = ROAD_WIDTH; // (Ar)
export const roundaboutRadius = ROUNDABOUT_RADIUS; // (_n)
/** Roundabout centres {x, y} (y = world z). (Ys) */
export const roundabouts = LAYOUT.ROUNDABOUTS.map((r) => ({ x: r.x, y: r.z }));
/** Road polylines {pts, dashed}. (ul) */
export const roads = LAYOUT.ROADS ?? LAYOUT.ROAD_LINES.map((pts) => ({ pts, dashed: true }));

/** Circles around junctions (r 10) and roundabouts (ring + 9). (Z2) */
export const junctionDiscs = [
  ...junctionPoints.map(([x, y]) => ({ x, y, r: 10 })),
  ...roundabouts.map((r) => ({ x: r.x, y: r.y, r: ROUNDABOUT_RADIUS + 9 })),
];
/** Ponds with y = z, ry = rz. (fl) */
export const pondsPlanar = ponds.map((p) => ({ ...p, y: p.z, ry: p.rz }));
/** Main field rect (first field): {x, y, w, h}. (mi) */
// shaped rugs may have no football pitch: fall back to a 1x1 marker in the middle of the rug
const field0 = fields[0] ?? { x: 0, z: 0, w: 1, d: 1 };
export const mainField = { x: field0.x, y: field0.z, w: field0.w, h: field0.d };
/** Parking rects. (zl) */
export const parkingRects = parkingLots.map((p) => ({ x: p.x, y: p.z, w: p.w, h: p.d }));
/** Zebra crossings {x, y, a}: angle from the warped neighbouring point. (j2) */
export const zebraCrossings = LAYOUT.ZEBRA_SPOTS.map(([x, y, horizontal]) => {
  const [wx, wy] = warpLayout(x, y);
  const [nx, ny] = horizontal ? warpLayout(x + 3, y) : warpLayout(x, y + 3);
  return { x: wx, y: wy, a: Math.atan2(ny - wy, nx - wx) };
});
