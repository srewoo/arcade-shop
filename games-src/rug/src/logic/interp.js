// Render interpolation between the previous and current fixed-step pose. Pure.
// alpha = accumulator / step (0..1). Large jumps (respawn, teleport) are not blended.
import { angleDelta } from "../util/math.js";

/** Maximum distance (world units) that is still treated as continuous motion. */
export const MAX_BLEND_DISTANCE = 8;

export const renderAlpha = (accumulator, step) => (step > 0 ? Math.min(1, Math.max(0, accumulator / step)) : 1);

/**
 * @param {{x:number,y:number,z:number,a:number}|null|undefined} prev
 * @param {{x:number,y:number,z:number,a:number}} cur
 * @returns {{x:number,y:number,z:number,a:number}} the pose to draw
 */
export function blendPose(prev, cur, alpha) {
  if (!prev || alpha >= 1 || Math.hypot(cur.x - prev.x, cur.z - prev.z) > MAX_BLEND_DISTANCE) {
    return { x: cur.x, y: cur.y, z: cur.z, a: cur.a };
  }
  return {
    x: prev.x + (cur.x - prev.x) * alpha,
    y: prev.y + (cur.y - prev.y) * alpha,
    z: prev.z + (cur.z - prev.z) * alpha,
    a: prev.a + angleDelta(prev.a, cur.a) * alpha,
  };
}
