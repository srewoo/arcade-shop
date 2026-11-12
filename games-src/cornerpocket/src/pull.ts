// Slingshot pull maths. The view scale is passed in so power resolution is constant in screen space.
import { INPUT } from './config/input';

export const pullMax = (scale: number): number => Math.max(INPUT.pullMaxTable, INPUT.pullMaxScreen / Math.max(scale, 0.05));
export const grabRadius = (scale: number): number => Math.max(INPUT.grabTable, INPUT.grabScreen / Math.max(scale, 0.05));

/** Power 0..1 for a pull of `len` table px at view `scale`; 0 inside the cancel zone. */
export function pullPower(len: number, scale: number): number {
  if (len < INPUT.pullMin) return 0;
  return Math.min(1, Math.max(0, (len - INPUT.pullMin) / pullMax(scale)));
}
