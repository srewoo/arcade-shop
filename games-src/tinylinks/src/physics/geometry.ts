import type { Shape, Vec } from './types';

export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Squared distance from p to segment ab, and the closest point written into `out`. */
export function closestOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number, out: Vec): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  out.x = ax + dx * t;
  out.y = ay + dy * t;
  const ex = px - out.x;
  const ey = py - out.y;
  return ex * ex + ey * ey;
}

/** Even-odd test across several polygons (islands cut holes in the course). */
export function insidePolys(x: number, y: number, polys: readonly (readonly Vec[])[]): boolean {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i] as Vec;
      const b = poly[j] as Vec;
      if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
    }
  }
  return inside;
}

export function inShape(x: number, y: number, s: Shape): boolean {
  if (s.t === 'r') return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  const dx = (x - s.x) / s.rx;
  const dy = (y - s.y) / s.ry;
  return dx * dx + dy * dy <= 1;
}

export interface Seg { readonly ax: number; readonly ay: number; readonly bx: number; readonly by: number }

export function polysToSegments(polys: readonly (readonly Vec[])[]): Seg[] {
  const out: Seg[] = [];
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i] as Vec;
      const b = poly[(i + 1) % poly.length] as Vec;
      out.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y });
    }
  }
  return out;
}

export const rectPoly = (x: number, y: number, w: number, h: number): Vec[] => [
  { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
];
