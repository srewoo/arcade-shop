// Small geometry helpers shared by the scene painters.
import { CONFIG } from '../config';
import type { Camera } from './camera';

/** Screen y of the back of the pin deck, where the office wall meets the floor. */
export function farEnd(cam: Camera): number {
  return cam.project(CONFIG.lane.backX, cam.portrait ? 0 : -CONFIG.lane.gutterHalf).y - (cam.portrait ? 0 : 4);
}

export type Pt = { x: number; y: number };

/** Fill a lane-space quad as a projected polygon. */
export function quad(c: CanvasRenderingContext2D, cam: Camera, pts: readonly (readonly [number, number])[]): void {
  c.beginPath();
  pts.forEach(([x, y], i) => {
    const p = cam.project(x, y);
    if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y);
  });
  c.closePath();
}
