// Oriented-box geometry. Pure and DOM-free.
export interface Vec {
  readonly x: number;
  readonly y: number;
}
/** Oriented rectangle: centre, half extents along its own axes, rotation. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly hw: number;
  readonly hh: number;
  readonly a: number;
}

export const wrapAngle = (a: number): number => {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r - Math.PI;
};

/** Smallest absolute difference between two headings, treating a and a+PI as equal when `axis`. */
export function angleDiff(a: number, b: number, axis: boolean): number {
  let d = Math.abs(wrapAngle(a - b));
  if (axis && d > Math.PI / 2) d = Math.PI - d;
  return d;
}

export function corners(b: Box, grow = 0): Vec[] {
  const c = Math.cos(b.a);
  const s = Math.sin(b.a);
  const hw = b.hw + grow;
  const hh = b.hh + grow;
  return [
    { x: b.x + c * hw - s * hh, y: b.y + s * hw + c * hh },
    { x: b.x + c * hw + s * hh, y: b.y + s * hw - c * hh },
    { x: b.x - c * hw + s * hh, y: b.y - s * hw - c * hh },
    { x: b.x - c * hw - s * hh, y: b.y - s * hw + c * hh },
  ];
}

function separated(axis: Vec, p: readonly Vec[], q: readonly Vec[]): boolean {
  let pMin = Infinity;
  let pMax = -Infinity;
  let qMin = Infinity;
  let qMax = -Infinity;
  for (const v of p) {
    const d = v.x * axis.x + v.y * axis.y;
    pMin = Math.min(pMin, d);
    pMax = Math.max(pMax, d);
  }
  for (const v of q) {
    const d = v.x * axis.x + v.y * axis.y;
    qMin = Math.min(qMin, d);
    qMax = Math.max(qMax, d);
  }
  return pMax < qMin || qMax < pMin;
}

/** Separating-axis overlap test; `grow` inflates the first box (safety margin). */
export function overlaps(a: Box, b: Box, grow = 0): boolean {
  const reach = Math.hypot(a.hw + grow, a.hh + grow) + Math.hypot(b.hw, b.hh);
  if (Math.hypot(a.x - b.x, a.y - b.y) > reach) return false;
  const p = corners(a, grow);
  const q = corners(b);
  const axes: Vec[] = [
    { x: Math.cos(a.a), y: Math.sin(a.a) },
    { x: -Math.sin(a.a), y: Math.cos(a.a) },
    { x: Math.cos(b.a), y: Math.sin(b.a) },
    { x: -Math.sin(b.a), y: Math.cos(b.a) },
  ];
  return axes.every((axis) => !separated(axis, p, q));
}

/** True when every corner of `inner` lies inside `outer` (grown by `tol`). */
export function containedIn(inner: Box, outer: Box, tol = 0): boolean {
  const c = Math.cos(outer.a);
  const s = Math.sin(outer.a);
  return corners(inner).every((p) => {
    const dx = p.x - outer.x;
    const dy = p.y - outer.y;
    const u = dx * c + dy * s;
    const v = -dx * s + dy * c;
    return Math.abs(u) <= outer.hw + tol && Math.abs(v) <= outer.hh + tol;
  });
}

/** True when the box lies fully inside the axis-aligned rectangle [0,w]x[0,h]. */
export const insideWorld = (b: Box, w: number, h: number, grow = 0): boolean =>
  corners(b, grow).every((p) => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h);
