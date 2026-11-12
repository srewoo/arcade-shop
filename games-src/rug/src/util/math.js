// Small math / easing helpers shared across the game (original minified names in comments).

/** mulberry32 PRNG (original `Ye`). Returns a function producing floats in [0,1). */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 1831565813) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Variant PRNG (original `El`): same constants but `| 0` accumulation and a slightly
 * different mixing step. Used by the procedural "sol" map scatter code.
 */
export function mulberry32Signed(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 1831565813) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** True on touch-first devices (pointer: coarse); the game lowers quality there (original `Ir`). */
export const IS_COARSE_POINTER = typeof matchMedia < "u" && matchMedia("(pointer: coarse)").matches;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;

/** smoothstep(edge0, edge1, x) with clamping. */
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;

/** Pop-in easing 0 -> 1 with damped overshoot (original `Cc`). */
export function popInOvershoot(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const base = 1 - Math.pow(1 - t, 3);
  const wobble = Math.sin(t * Math.PI * 2.2) * Math.pow(1 - t, 1.6) * 0.32;
  return base + wobble * smoothstep(0.15, 0.45, t);
}

/** Pop-out easing 1 -> 0 with a small initial swell (original `Pc`). */
export function popOutShrink(t) {
  if (t <= 0) return 1;
  if (t >= 1) return 0;
  const swell = Math.sin(Math.min(t / 0.25, 1) * Math.PI) * 0.07;
  return 1 + swell - smoothstep(0.12, 1, t) * (1 + swell);
}

/** Shortest signed angular difference from `from` to `to`, in (-PI, PI] (original `Hy`). */
export function angleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const degToRad = (deg) => (deg * Math.PI) / 180;
