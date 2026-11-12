// Small math/random helpers.  Bundle symbols: _l lerp, vl clamp, z rand, yl pick, bl damp, xl weightedPick, Sl Spring.

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** Uniform random in [lo, hi). */
export const rand = (lo = 0, hi = 1) => lo + Math.random() * (hi - lo);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
/** Frame-rate independent exponential smoothing toward `target`. */
export const damp = (current, target, rate, dt) => lerp(current, target, 1 - Math.exp(-rate * dt));

/** Pick a key from [[value, weight], ...]. */
export function weightedPick(entries) {
  let total = 0;
  for (const [, w] of entries) total += w;
  let roll = Math.random() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** Critically-ish damped spring used for squash / nod / whip secondary motion. */
export class Spring {
  constructor(stiffness = 120, damping = 12) {
    this.k = stiffness;
    this.c = damping;
    this.x = 0;
    this.v = 0;
  }
  kick(impulse) {
    this.v += impulse;
  }
  update(dt) {
    this.v += (-this.k * this.x - this.c * this.v) * dt;
    this.x += this.v * dt;
    return this.x;
  }
  reset() {
    this.x = 0;
    this.v = 0;
  }
}
