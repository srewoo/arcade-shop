// Ghost-arrow guide path: the ball's route under the same hook rules, ball only.
import { CONFIG } from './config';
import { lerp } from './util';

const { ball: B } = CONFIG;

export interface PathPoint { readonly x: number; readonly y: number }

/** Sample the path of an unobstructed ball up to `maxX` along the lane. */
export function previewPath(angle: number, curve: number, power: number, maxX: number): PathPoint[] {
  const speed0 = lerp(B.minSpeed, B.maxSpeed, power);
  let vx = Math.cos(angle) * speed0, vy = Math.sin(angle) * speed0;
  let x = 0, y = 0;
  const pts: PathPoint[] = [{ x, y }];
  const dt = 1 / 30;
  for (let i = 0; i < 200 && x < maxX; i++) {
    const speed = Math.hypot(vx, vy);
    if (x > B.hookStartX && curve !== 0) {
      const a = curve * B.curveAccel * dt;
      vx += (-vy / speed) * a;
      vy += (vx / speed) * a;
    }
    const slowed = Math.max(0, speed - B.decel * dt) / (Math.hypot(vx, vy) || 1);
    vx *= slowed; vy *= slowed;
    x += vx * dt; y += vy * dt;
    pts.push({ x, y });
  }
  return pts;
}
