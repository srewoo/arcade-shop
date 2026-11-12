/**
 * Assembles the Claude (Grid City) layout namespace. In the original bundle this was a
 * separately-inlined module whose exports were frozen into one object (q2).
 */
import {
  CLAUDE_HALF_H,
  CLAUDE_HALF_W,
  CLAUDE_RING_R,
  CLAUDE_ROAD_W,
} from "./claude/claudeWorld.js";
import { claudeRouteData } from "./claudeRoute.js";
import {
  BALL_CLAUDE,
  BRICK_H_CLAUDE,
  PALETTES_CLAUDE,
  STAND_CLAUDE,
  ZEBRA_SPOTS_CLAUDE,
  bricksClaude,
  catCrossingsClaude,
  farmFieldsClaude,
  fieldsClaude,
  junctionPointsWarped,
  parkingClaude,
  pathsClaude,
  pondsClaude,
  railwayClaude,
  roadLinesWarped,
  roadsWarped,
  roundaboutsWarped,
  sofaBottomClaude,
  sofaLegsClaudeList,
  towersClaude,
} from "./layoutClaudeBase.js";
import {
  ducksClaude,
  fencesClaude,
  housesClaude,
  reedsClaude,
  treesClaude,
} from "./layoutClaudeEntities.js";
import { warpPoint } from "./warp.js";

/** Frozen layout namespace for Claude maps. (q2) */
export const CLAUDE_LAYOUT = Object.freeze({
  BALL: BALL_CLAUDE,
  BRICK_H: BRICK_H_CLAUDE,
  CAT_CROSSINGS: catCrossingsClaude,
  FARM_FIELDS: farmFieldsClaude,
  HX: CLAUDE_HALF_W,
  HZ: CLAUDE_HALF_H,
  JUNCTION_POINTS: junctionPointsWarped,
  PALETTES: PALETTES_CLAUDE,
  PATHS: pathsClaude,
  RAILWAY: railwayClaude,
  RB_R: CLAUDE_RING_R,
  ROAD: CLAUDE_ROAD_W,
  ROADS: roadsWarped,
  ROAD_LINES: roadLinesWarped,
  ROUNDABOUTS: roundaboutsWarped,
  SOFA_BOTTOM: sofaBottomClaude,
  STAND: STAND_CLAUDE,
  ZEBRA_SPOTS: ZEBRA_SPOTS_CLAUDE,
  bricks: bricksClaude,
  ducks: ducksClaude,
  fences: fencesClaude,
  fields: fieldsClaude,
  houses: housesClaude,
  parking: parkingClaude,
  ponds: pondsClaude,
  reeds: reedsClaude,
  route: claudeRouteData,
  sofaLegs: sofaLegsClaudeList,
  towers: towersClaude,
  trees: treesClaude,
  warp: warpPoint,
});
