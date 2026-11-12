// Ghost-ball aim guide: first contact point and deflection directions. Pure geometry.
import { BALL_R, TABLE_H, TABLE_W } from './constants';
import type { Ball } from './physics';

export interface Vec { x: number; y: number }

export interface AimGuide {
  from: Vec;
  end: Vec; // where the aim line stops (ghost ball centre or cushion contact)
  hitId: number | null;
  objectDir: Vec | null; // direction the object ball will travel
  cueDir: Vec | null; // direction the cue ball deflects to (elastic, equal mass)
}

function rayCircle(o: Vec, d: Vec, c: Vec, rad: number): number | null {
  const fx = o.x - c.x;
  const fy = o.y - c.y;
  const b = fx * d.x + fy * d.y;
  const disc = b * b - (fx * fx + fy * fy - rad * rad);
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 1e-6 ? t : null;
}

function rayWall(o: Vec, d: Vec): number {
  const lo = BALL_R;
  const tx = d.x > 1e-9 ? (TABLE_W - lo - o.x) / d.x : d.x < -1e-9 ? (lo - o.x) / d.x : Infinity;
  const ty = d.y > 1e-9 ? (TABLE_H - lo - o.y) / d.y : d.y < -1e-9 ? (lo - o.y) / d.y : Infinity;
  return Math.max(0, Math.min(tx, ty));
}

export function computeAim(balls: readonly Ball[], angle: number): AimGuide | null {
  const cue = balls.find((b) => b.id === 0 && !b.pocketed);
  if (!cue) return null;
  const d = { x: Math.cos(angle), y: Math.sin(angle) };
  const from = { x: cue.x, y: cue.y };
  let best = rayWall(from, d);
  let hit: Ball | null = null;
  for (const b of balls) {
    if (b.id === 0 || b.pocketed) continue;
    const t = rayCircle(from, d, b, 2 * BALL_R);
    if (t !== null && t < best) { best = t; hit = b; }
  }
  const end = { x: from.x + d.x * best, y: from.y + d.y * best };
  if (!hit) return { from, end, hitId: null, objectDir: null, cueDir: null };
  const n = { x: (hit.x - end.x) / (2 * BALL_R), y: (hit.y - end.y) / (2 * BALL_R) };
  const dot = d.x * n.x + d.y * n.y;
  const tx = d.x - dot * n.x;
  const ty = d.y - dot * n.y;
  const tl = Math.hypot(tx, ty);
  return {
    from, end, hitId: hit.id, objectDir: n,
    cueDir: tl > 0.02 ? { x: tx / tl, y: ty / tl } : null,
  };
}
