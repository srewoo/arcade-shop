// Pure 2D path helpers for closed routes: polygon fillets, constant-spacing resampling, smoothing.

/**
 * Round the corners of a closed polygon. Vertex = [x, z, radius]; radius 0 keeps a sharp vertex,
 * otherwise a circular fillet of that radius is inserted (16 segments).
 */
export function roundCorners(verts) {
  const out = [];
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const [x, z, radius] = verts[i];
    if (!radius) {
      out.push([x, z]);
      continue;
    }
    const [px, pz] = verts[(i - 1 + n) % n];
    const [nx, nz] = verts[(i + 1) % n];
    let ax = px - x;
    let az = pz - z;
    let bx = nx - x;
    let bz = nz - z;
    const la = Math.hypot(ax, az);
    const lb = Math.hypot(bx, bz);
    ax /= la;
    az /= la;
    bx /= lb;
    bz /= lb;
    const halfAngle = Math.acos(ax * bx + az * bz) / 2;
    const tangentDist = radius / Math.tan(halfAngle);
    const p0 = [x + ax * tangentDist, z + az * tangentDist];
    const p1 = [x + bx * tangentDist, z + bz * tangentDist];
    let mx = ax + bx;
    let mz = az + bz;
    const ml = Math.hypot(mx, mz);
    mx /= ml;
    mz /= ml;
    const centreDist = radius / Math.sin(halfAngle);
    const cx = x + mx * centreDist;
    const cz = z + mz * centreDist;
    const startAngle = Math.atan2(p0[1] - cz, p0[0] - cx);
    let sweep = Math.atan2(p1[1] - cz, p1[0] - cx) - startAngle;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    while (sweep < -Math.PI) sweep += 2 * Math.PI;
    for (let k = 0; k <= 16; k++) {
      const a = startAngle + (sweep * k) / 16;
      out.push([cx + radius * Math.cos(a), cz + radius * Math.sin(a)]);
    }
  }
  return out;
}

/** Resample a closed polyline at constant spacing `step` (carrying the remainder across segments). */
export function resamplePolyline(pts, step) {
  const n = pts.length;
  const out = [];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (segLen < 1e-6) continue;
    let d = carry;
    while (d < segLen) {
      const u = d / segLen;
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      d += step;
    }
    carry = d - segLen;
  }
  return out;
}

/** Closed moving-average smoothing: window 2*halfWindow+1, repeated `passes` times. */
export function smoothClosedPath(pts, halfWindow, passes) {
  let cur = pts;
  const n = pts.length;
  for (let p = 0; p < passes; p++) {
    const next = new Array(n);
    let sx = 0;
    let sz = 0;
    for (let k = -halfWindow; k <= halfWindow; k++) {
      const q = cur[(k + n) % n];
      sx += q[0];
      sz += q[1];
    }
    const w = 2 * halfWindow + 1;
    for (let i = 0; i < n; i++) {
      next[i] = [sx / w, sz / w];
      const add = cur[(i + halfWindow + 1) % n];
      const sub = cur[(i - halfWindow + n) % n];
      sx += add[0] - sub[0];
      sz += add[1] - sub[1];
    }
    cur = next;
  }
  return cur;
}

