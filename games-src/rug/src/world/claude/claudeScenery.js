// Grid City fixed scenery rectangles: ponds, football pitch, parking lots, farm fields, railway.

/** Ponds (ellipses) {x,y,rx,ry,seed}. */
export const PONDS = [
  { x: 101, y: -46, rx: 11, ry: 16, seed: 3 },
  { x: 101, y: 40, rx: 11, ry: 18, seed: 7 },
];
/** Football pitch rectangle (centre, size). */
export const FOOTBALL = { x: 32, y: 27, w: 44, h: 26 };
/** Parking lots. */
export const PARKINGS = [
  { x: -34, y: -31.5, w: 28, h: 19 },
  { x: -10.5, y: 36, w: 31, h: 14 },
];
/** Farm fields {x,y,w,h,type}. */
export const FARM_FIELDS = [
  { x: 27, y: -32.5, w: 24, h: 15, type: "wheat" },
  { x: 57, y: -32.5, w: 25, h: 15, type: "cabbage" },
  { x: 35, y: -14.5, w: 37, h: 9, type: "corn" },
];
/** Railway line along y with x range. */
export const RAILWAY = { y: -67, x0: -115, x1: 115 };
