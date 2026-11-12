import type { Shape, Vec } from '../physics/types';

export const P = (x: number, y: number): Vec => ({ x, y });
/** Build a polygon from a flat [x0, y0, x1, y1, ...] list. */
export function poly(...n: number[]): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push({ x: n[i] as number, y: n[i + 1] as number });
  return out;
}
export const rect = (x: number, y: number, w: number, h: number): Shape => ({ t: 'r', x, y, w, h });
export const oval = (x: number, y: number, rx: number, ry: number): Shape => ({ t: 'e', x, y, rx, ry });
