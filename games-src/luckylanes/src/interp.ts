// Render-time interpolation between the previous and current fixed physics step
// (alpha = accumulator / step), so 120/144 Hz screens look smooth. Never feeds the sim.
import type { Ball, Pin, World } from './worldTypes';

export interface Snapshot {
  valid: boolean;
  ball: { x: number; y: number; roll: number };
  pins: { x: number; y: number }[];
}

export const createSnapshot = (): Snapshot => ({ valid: false, ball: { x: 0, y: 0, roll: 0 }, pins: [] });

export function capture(s: Snapshot, w: World): void {
  s.valid = true;
  s.ball.x = w.ball.x;
  s.ball.y = w.ball.y;
  s.ball.roll = w.ball.roll;
  for (let i = 0; i < w.pins.length; i++) {
    const p = w.pins[i] as Pin;
    const slot = s.pins[i];
    if (slot) { slot.x = p.x; slot.y = p.y; } else s.pins[i] = { x: p.x, y: p.y };
  }
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface RenderView {
  readonly ball: Ball;
  readonly pins: readonly Pin[];
}

/** Positions blended `alpha` of the way from the snapshot to the world. */
export function interpolate(s: Snapshot, w: World, alpha: number): RenderView {
  if (!s.valid || alpha >= 1) return { ball: w.ball, pins: w.pins };
  const a = Math.max(0, alpha);
  const ball: Ball = { ...w.ball, x: lerp(s.ball.x, w.ball.x, a), y: lerp(s.ball.y, w.ball.y, a), roll: lerp(s.ball.roll, w.ball.roll, a) };
  const pins = w.pins.map((p, i) => {
    const prev = s.pins[i];
    return prev ? { ...p, x: lerp(prev.x, p.x, a), y: lerp(prev.y, p.y, a) } : p;
  });
  return { ball, pins };
}
