// "Claude" (Grid City) map constants, in design space (world units on the rug).
// Several are derived from the roundabout fillet geometry.

/** Rug dimensions {W, H, border}. */
export const RUG = { W: 240, H: 160, border: 5 };
/** Road width. */
export const ROAD_W = 14;
export const ROAD_HALF = ROAD_W / 2;
/** Roundabout ring radius. */
export const RING_R = 14;
/** Fillet radius joining roundabout arms to the track. */
export const FILLET_R = 10;
/** PHI = asin(FILLET_R / (RING_R + FILLET_R)) in degrees; ALPHA is its complement. */
export const PHI = (Math.asin(FILLET_R / (RING_R + FILLET_R)) * 180) / Math.PI;
export const ALPHA = 90 - PHI;
/** Distance from the roundabout centre to the fillet tangent point. */
export const FILLET_DIST = (RING_R + FILLET_R) * Math.cos((PHI * Math.PI) / 180);
/** The two roundabouts. */
export const ROUNDABOUTS = [
  { x: 80, y: 0, name: "east" },
  { x: -10, y: 0, name: "center" },
];
/** Corner radius of the rectangular track. */
export const CR = 20;
