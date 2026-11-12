// Swept circle vs axis-aligned box. The box is grown by the radius and the circle's centre
// is cast as a ray, so a fast ball can never skip over a brick.
export interface Hit { t: number; nx: number; ny: number }

export function sweepCircleBox(
  x: number, y: number, dx: number, dy: number, r: number,
  left: number, top: number, right: number, bottom: number,
): Hit | null {
  const l = left - r;
  const t0 = top - r;
  const rr = right + r;
  const b = bottom + r;
  if (dx === 0 && (x <= l || x >= rr)) return null;
  if (dy === 0 && (y <= t0 || y >= b)) return null;
  const [tx1, tx2] = axisSpan(x, dx, l, rr);
  const [ty1, ty2] = axisSpan(y, dy, t0, b);
  const entry = Math.max(tx1, ty1);
  const exit = Math.min(tx2, ty2);
  if (entry > exit || exit < 0 || entry > 1) return null;
  if (entry < 0) return penetration(x, y, l, t0, rr, b);
  if (tx1 > ty1) return { t: entry, nx: dx > 0 ? -1 : 1, ny: 0 };
  return { t: entry, nx: 0, ny: dy > 0 ? -1 : 1 };
}

function axisSpan(p: number, d: number, lo: number, hi: number): [number, number] {
  if (d === 0) return [-Infinity, Infinity];
  const a = (lo - p) / d;
  const b = (hi - p) / d;
  return a < b ? [a, b] : [b, a];
}

/** Circle already overlapping the grown box: push out along the shallowest axis. */
function penetration(x: number, y: number, l: number, t: number, r: number, b: number): Hit {
  const depths = [
    { d: x - l, nx: -1, ny: 0 },
    { d: r - x, nx: 1, ny: 0 },
    { d: y - t, nx: 0, ny: -1 },
    { d: b - y, nx: 0, ny: 1 },
  ];
  let best = depths[0] as (typeof depths)[number];
  for (const cand of depths) if (cand.d < best.d) best = cand;
  return { t: 0, nx: best.nx, ny: best.ny };
}
