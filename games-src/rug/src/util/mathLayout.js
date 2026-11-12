// Smoothstep with explicit edges, used by the layout warp (wn) to blend offsets around rings.
// RE: renamed from the registry's `smoothstep`; identical formula to util/math.js smoothstep but arguments are (edge0, edge1, x).
export const smoothstepLayout = (edge0, edge1, x) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
