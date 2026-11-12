import type { MoverDef, Vec } from './types';
import { CONFIG } from '../config';

const TAU = Math.PI * 2;
export const tickToSec = (tick: number): number => tick * CONFIG.sim.dt;

/** Four corners (clockwise) of a moving obstacle at time t seconds. */
export function moverPoly(m: MoverDef, t: number, out: Vec[]): Vec[] {
  while (out.length < 4) out.push({ x: 0, y: 0 });
  if (m.kind === 'slide') {
    const off = m.amp * Math.sin((TAU * t) / m.period + m.phase);
    const cx = m.axis === 'x' ? m.cx + off : m.cx;
    const cy = m.axis === 'y' ? m.cy + off : m.cy;
    const hw = m.w / 2;
    const hh = m.h / 2;
    set(out[0], cx - hw, cy - hh); set(out[1], cx + hw, cy - hh); set(out[2], cx + hw, cy + hh); set(out[3], cx - hw, cy + hh);
    return out;
  }
  const a = m.phase + m.omega * t;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const hl = m.len / 2;
  const ht = m.thick / 2;
  const corners: [number, number][] = [[-hl, -ht], [hl, -ht], [hl, ht], [-hl, ht]];
  corners.forEach(([lx, ly], i) => set(out[i], m.cx + lx * c - ly * s, m.cy + lx * s + ly * c));
  return out;
}

function set(v: Vec | undefined, x: number, y: number): void {
  if (v) { v.x = x; v.y = y; }
}

/** Velocity (u/s) of the obstacle surface at point p, written to `out`. */
export function moverVelocity(m: MoverDef, t: number, p: Vec, out: Vec): void {
  if (m.kind === 'slide') {
    const v = m.amp * ((TAU) / m.period) * Math.cos((TAU * t) / m.period + m.phase);
    out.x = m.axis === 'x' ? v : 0;
    out.y = m.axis === 'y' ? v : 0;
    return;
  }
  out.x = -m.omega * (p.y - m.cy);
  out.y = m.omega * (p.x - m.cx);
}

/** Radius from the pivot a mover can sweep (for validity checks). */
export const moverExtent = (m: MoverDef): { x0: number; y0: number; x1: number; y1: number } => {
  if (m.kind === 'slide') {
    const ax = m.axis === 'x' ? m.amp : 0;
    const ay = m.axis === 'y' ? m.amp : 0;
    return { x0: m.cx - ax - m.w / 2, y0: m.cy - ay - m.h / 2, x1: m.cx + ax + m.w / 2, y1: m.cy + ay + m.h / 2 };
  }
  const r = Math.hypot(m.len / 2, m.thick / 2);
  return { x0: m.cx - r, y0: m.cy - r, x1: m.cx + r, y1: m.cy + r };
};
