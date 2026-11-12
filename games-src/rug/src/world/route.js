/**
 * Builds a closed-loop route object from a polyline of [x, z] points (spacing ~1 unit).
 * `s` (arc length parameter) == point index because the input is resampled at 1 unit.
 *
 * Returned fields:
 *  n/len  number of points; x,z positions; tx,tz unit tangents (central difference, +-2 samples);
 *  curv   signed curvature estimate per sample (angle between tangents at +-3, divided by 6);
 *  mod(s) wrap s into [0,len); at(s, lateral) interpolated pose with lateral offset (left normal = (-tz, tx));
 *  nearestGlobal(x,z) index of the closest sample (brute force); maxCurvAhead(s, span) max |curv| over [s, s+span).
 */
export function makeRouteFromPoints(points) {
  const n = points.length;
  const xs = new Float32Array(n);
  const zs = new Float32Array(n);
  const txs = new Float32Array(n);
  const tzs = new Float32Array(n);
  const curv = new Float32Array(n);
  points.forEach((p, i) => {
    xs[i] = p[0];
    zs[i] = p[1];
  });
  for (let i = 0; i < n; i++) {
    const next = (i + 2) % n;
    const prev = (i - 2 + n) % n;
    const dx = xs[next] - xs[prev];
    const dz = zs[next] - zs[prev];
    const len = Math.hypot(dx, dz) || 1;
    txs[i] = dx / len;
    tzs[i] = dz / len;
  }
  for (let i = 0; i < n; i++) {
    const next = (i + 3) % n;
    const prev = (i - 3 + n) % n;
    curv[i] = Math.atan2(txs[prev] * tzs[next] - tzs[prev] * txs[next], txs[prev] * txs[next] + tzs[prev] * tzs[next]) / 6;
  }
  const mod = (s) => ((s % n) + n) % n;
  const sample = (arr, s) => {
    const m = mod(s);
    const i0 = Math.floor(m);
    const f = m - i0;
    return arr[i0] + (arr[(i0 + 1) % n] - arr[i0]) * f;
  };
  return {
    n,
    len: n,
    x: xs,
    z: zs,
    tx: txs,
    tz: tzs,
    curv,
    mod,
    at(s, lateral = 0) {
      const t = { x: sample(txs, s), z: sample(tzs, s) };
      const tl = Math.hypot(t.x, t.z) || 1;
      t.x /= tl;
      t.z /= tl;
      return {
        x: sample(xs, s) - t.z * lateral,
        z: sample(zs, s) + t.x * lateral,
        tx: t.x,
        tz: t.z,
        heading: Math.atan2(t.z, t.x),
      };
    },
    nearestGlobal(x, z) {
      let best = 0;
      let bestD = 1e12;
      for (let i = 0; i < n; i++) {
        const d = (xs[i] - x) ** 2 + (zs[i] - z) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    },
    maxCurvAhead(s, span) {
      let m = 0;
      for (let k = 0; k < span; k += 3) m = Math.max(m, Math.abs(curv[Math.floor(mod(s + k))]));
      return m;
    },
  };
}
