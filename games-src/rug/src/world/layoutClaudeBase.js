/**
 * Claude (Grid City) layout, part 1: warped roads/junctions, the optional procedurally
 * arranged layout (random "arrange" maps), ponds/fields/parking, LEGO bricks, towers,
 * sofa legs, cat crossings and the giant ball zone.
 * Original minified names in parentheses.
 */
import { MAP } from "../config/maps.js";
import { generateRandomLayout } from "./layoutGenerator.js";
import { placeRouteProps, underSofaEdge } from "./routeProps.js";
import {
  CLAUDE_HALF_H,
  CLAUDE_HALF_W,
  CLAUDE_RING_R,
  CLAUDE_ROAD_W,
  CLAUDE_SCALE,
  claudeWarp,
} from "./claude/claudeWorld.js";
import { ROUNDABOUTS } from "./claude/claudeConfig.js";
import { JUNCTIONS, ROADS } from "./claude/claudeRoads.js";
import { TRACK as CLAUDE_BASE_TRACK } from "./claude/claudeTrack.js";
import { BRICK_PILES, BALL as CLAUDE_BALL_BASE, BRICK_SPOTS, SOFA } from "./claude/claudeTrees.js";
import { PATHS as CLAUDE_PATHS } from "./claude/claudeFences.js";
import { FARM_FIELDS, FOOTBALL, PARKINGS, PONDS, RAILWAY } from "./claude/claudeScenery.js";
import { claudeRouteData } from "./claudeRoute.js";
import { warpEntity, warpPoint, warpPointObj, warpWorld } from "./warp.js";

/** Roundabout centres, warped. (S2) */
export const roundaboutsWarped = ROUNDABOUTS.map(warpPointObj);
/** Road polylines, warped: {pts, dashed}. (C0) */
export const roadsWarped = ROADS.map((road) => ({
  pts: road.pts.map(([x, y]) => warpPoint(x, y)),
  dashed: road.dashed,
}));
/** Warped road polylines only. (P0) */
export const roadLinesWarped = roadsWarped.map((road) => road.pts);

/**
 * Procedurally arranged layout for maps with `arrange` (claude-bend / claude-wild), else null.
 * Zones are the free rectangles between roads, "margins" the border strips. (_e)
 */
export const generatedLayout =
  MAP.base === "claude" && MAP.arrange
    ? generateRandomLayout(
        MAP.arrange,
        {
          CA: { x0: -98, x1: -22, z0: -50, z1: -10 },
          CB: { x0: -2, x1: 86, z0: -50, z1: -10 },
          CC: { x0: -98, x1: -22, z0: 10, z1: 52 },
          CD: { x0: -2, x1: 86, z0: 10, z1: 52 },
        },
        [
          { x0: -138, x1: 138, z0: 74, z1: 90 },
          { x0: 112, x1: 138, z0: -72, z1: -14 },
          { x0: 112, x1: 138, z0: 14, z1: 68 },
          { x0: -138, x1: -120, z0: -72, z1: 68 },
        ],
        MAP.seed,
        {
          route: claudeRouteData,
          warp: warpWorld,
          lines: roadLinesWarped,
          road: CLAUDE_ROAD_W,
          hx: CLAUDE_HALF_W,
          hz: CLAUDE_HALF_H,
          rings: ROUNDABOUTS.map((ring) => {
            const [x, z] = warpPoint(ring.x, ring.y);
            return { x, z, r: CLAUDE_RING_R };
          }),
        },
      )
    : null;

// A fountain sits in the middle of every roundabout of a generated layout.
if (generatedLayout) {
  generatedLayout.houses.push(
    ...ROUNDABOUTS.map((ring, i) => ({
      ready: true,
      kind: "fountain",
      x: ring.x * CLAUDE_SCALE,
      z: ring.y * CLAUDE_SCALE,
      y: ring.y * CLAUDE_SCALE,
      r: 4.9,
      rot: 0,
      seed: 900 + i,
    })),
  );
}

/** Warped T-junction points. (w2) */
export const junctionPointsWarped = JUNCTIONS.map((j) => warpPoint(j.x, j.y));
/** Zebra crossing spots [x, z, horizontal?] in design space. (b2) */
export const ZEBRA_SPOTS_CLAUDE = [
  [-62, 52, true],
  [-58, 0, true],
  [52, -50, true],
  [-10, -26, false],
  [-40, 64, false],
  [80, 26, false],
  [24, 0, true],
  [-30, -50, true],
  [48, 52, true],
  [-90, -22, false],
  [80, -27, false],
];

/** Footpaths, warped. (T2) */
export const pathsClaude = generatedLayout
  ? generatedLayout.paths.map((path) => {
      const [ox, oz] = warpPoint(path.x / CLAUDE_SCALE, path.z / CLAUDE_SCALE);
      return path.pts.map(([x, z]) => [ox + x * (claudeWarp.mirror ? -1 : 1), oz + z]);
    })
  : CLAUDE_PATHS.map((path) => path.map(([x, y]) => warpPoint(x, y)));

/** Railway polyline sampled every 2 units. (E2) */
export const railwayClaude = (() => {
  const pts = [];
  for (let x = RAILWAY.x0; x <= RAILWAY.x1; x += 2) pts.push(warpPoint(x, RAILWAY.y));
  return pts;
})();

/** Ponds. (Zu) */
export const pondsClaude = generatedLayout
  ? generatedLayout.ponds.map(warpEntity)
  : PONDS.map((pond) => ({
      ...warpPointObj(pond),
      rx: pond.rx * CLAUDE_SCALE,
      rz: pond.ry * CLAUDE_SCALE,
      seed: pond.seed,
    }));
/** Fields (football pitch). (A2) */
export const fieldsClaude = generatedLayout
  ? generatedLayout.fields.map(warpEntity)
  : [{ ...warpPointObj(FOOTBALL), w: FOOTBALL.w * CLAUDE_SCALE, d: FOOTBALL.h * CLAUDE_SCALE }];
/** Parking lots. (R2) */
export const parkingClaude = generatedLayout
  ? generatedLayout.parking.map(warpEntity)
  : PARKINGS.map((lot) => ({ ...warpPointObj(lot), w: lot.w * CLAUDE_SCALE, d: lot.h * CLAUDE_SCALE }));
/** Farm fields with crop type. (C2) */
export const farmFieldsClaude = generatedLayout
  ? generatedLayout.farm.map((field) => {
      const [x, y] = warpWorld(field.x, field.y);
      return { ...field, x, y };
    })
  : FARM_FIELDS.map((field) => {
      const p = warpPointObj(field);
      return { x: p.x, y: p.z, w: field.w * CLAUDE_SCALE, h: field.h * CLAUDE_SCALE, type: field.type };
    });
/** Palettes: unused for claude maps. (P2) */
export const PALETTES_CLAUDE = [];
/** No spectator stand in Claude maps. (L2) */
export const STAND_CLAUDE = null;
/** Brick height. (I2) */
export const BRICK_H_CLAUDE = 3;

/** LEGO brick obstacles placed beside the nearest route sample, offset by `lat`. (D2) */
function bricksFromLegacy() {
  const pts = CLAUDE_BASE_TRACK.pts;
  return BRICK_SPOTS.map((spot) => {
    let nearest = 0;
    let best = 1e12;
    pts.forEach((p, idx) => {
      const d2 = (p[0] - spot.x) ** 2 + (p[1] - spot.y) ** 2;
      if (d2 < best) {
        best = d2;
        nearest = idx;
      }
    });
    const count = pts.length;
    const prev = pts[(nearest + count - 3) % count];
    const next = pts[(nearest + 3) % count];
    const len = Math.hypot(next[0] - prev[0], next[1] - prev[1]) || 1;
    const tx = (next[0] - prev[0]) / len;
    const ty = (next[1] - prev[1]) / len;
    const [x, z] = warpPoint(
      pts[nearest][0] - (ty * spot.lat) / CLAUDE_SCALE,
      pts[nearest][1] + (tx * spot.lat) / CLAUDE_SCALE,
    );
    const horizontal = Math.abs(tx) > Math.abs(ty);
    return { x, z, w: horizontal ? 10 : 6.5, d: horizontal ? 6.5 : 10, color: spot.color };
  });
}

/** Tower-block stacks (n storeys, colour). (U2) */
export const towersClaude = generatedLayout
  ? generatedLayout.towers.map(warpEntity)
  : BRICK_PILES.map((pile, i) => ({
      ...warpPointObj(pile),
      n: 3 + (i % 2),
      color: ["#e0352b", "#2d7fd6", "#3caa4f"][i % 3],
    }));

/** Route props (bricks, cats, sofa legs, sofa bottom) for generated layouts. (ds) */
export const generatedExtras = generatedLayout
  ? placeRouteProps(claudeRouteData, generatedLayout.houses.map(warpEntity))
  : null;

/** Sofa legs for the fixed layout: warped leg positions, radius 6.2, height 74. (N2) */
const sofaLegsFixed = () => SOFA.legs.map(([x, y]) => ({ ...warpPointObj({ x, y }), r: 6.2, h: 74 }));

/** LEGO bricks. (z2) */
export const bricksClaude = generatedExtras ? generatedExtras.bricks : bricksFromLegacy();
/** Sofa leg circles {x, z, r, h}. (Ds) */
export const sofaLegsClaudeList = generatedExtras ? generatedExtras.sofaLegs : sofaLegsFixed();

/** Sofa underside rectangle. (F2) */
export const sofaBottomClaude = generatedExtras
  ? generatedExtras.SOFA_BOTTOM
  : {
      x: sofaLegsClaudeList[0].x + (claudeWarp.mirror ? 75 : -75),
      z: (sofaLegsClaudeList[0].z + sofaLegsClaudeList[1].z) / 2,
      w: 150,
      d: Math.abs(sofaLegsClaudeList[0].z - sofaLegsClaudeList[1].z) + 44,
    };

/** Giant rolling ball zone {x, z0, z1, r}. (tl) */
export const BALL_CLAUDE = {
  x: generatedLayout ? claudeWarp.ballX : warpPoint(CLAUDE_BALL_BASE.x, 60)[0],
  z0: 134,
  z1: 34,
  r: 13,
};

/** Cat crossing points {x, z, dx, dz}. (O2) */
export const catCrossingsClaude = generatedExtras
  ? generatedExtras.cats
  : [
      [20, 52, 0, -1],
      [30, -50, 0, 1],
      [80, 26, -1, 0],
      [-90, 26, 1, 0],
    ].map(([x, y, dx, dz]) => ({ ...warpPointObj({ x, y }), dx, dz }));

/** Is the circle (x, z, r) inside the ball zone? (tu) */
export const insideBallZone = (x, z, r) =>
  generatedLayout
    ? underSofaEdge(BALL_CLAUDE, x, z, r)
    : z > 40 && Math.abs(x - BALL_CLAUDE.x) < BALL_CLAUDE.r + r + 1;

/** Is the circle (x, z, r) touching a sofa leg? (k2) */
export const insideSofaLeg = (x, z, r) =>
  sofaLegsClaudeList.some((leg) => Math.hypot(x - leg.x, z - leg.z) < leg.r + r + 1);
