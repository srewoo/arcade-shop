/**
 * Sizes and palette for the painted rug "print" texture and the road/water collision mask.
 * Original minified names in parentheses.
 */
import { IS_COARSE_POINTER } from "../util/math.js";
import { RUG } from "./layoutSelect.js";

/** Width in pixels of the painted map canvas (smaller on touch devices). (el) */
export const MAP_TEX_WIDTH = IS_COARSE_POINTER ? 2600 : 4800;
/** Height in pixels, keeping the rug aspect ratio. (Yd) */
export const MAP_TEX_HEIGHT = Math.round((MAP_TEX_WIDTH * RUG.H) / RUG.W);
/** Pixels per world unit for the road/water collision mask. (pl) */
export const COLLISION_SCALE = 4;

/** Colour palette of the painted map. (kt) */
export const COLORS = {
  grass: "#58a83a",
  grassDark: "#2f7a2c",
  grassEdge: "#2c6e2a",
  road: "#76797d",
  roadLine: "#f7f6f0",
  water: "#3e9fdc",
  waterDeep: "#2f86c8",
  waterLight: "#74c6f0",
  sand: "#ead59b",
  border: "#2c5ca6",
  borderDark: "#21477f",
  tree: "#2b7d33",
  treeMid: "#3f9e40",
  treeLight: "#79c552",
  pine: "#23704a",
  field: "#46a843",
  fieldDark: "#3b973b",
  path: "#f3c53f",
  pathEdge: "#d89a22",
  route: "#f7c525",
  routeEdge: "#e39a12",
};
