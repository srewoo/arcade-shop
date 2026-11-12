// Text readouts for the three meters (shown beside each bar and used as aria-valuetext). Pure.
import { S } from './strings';

const side = (v: number): string => (v < 0 ? S.left : S.right);

/** Aim bar position -1..1 as words: "centre", "left 3", "right 7". */
export function aimReadout(u: number): string {
  const n = Math.round(Math.abs(u) * 10);
  return n === 0 ? S.centre : `${side(u)} ${n}`;
}

/** Power 0..1 as a percentage. */
export const powerReadout = (power: number): string => `${Math.round(Math.max(0, Math.min(1, power)) * 100)}%`;

/** Hook bar position -1..1 as words: "straight", "left 4". */
export function spinReadout(u: number): string {
  const n = Math.round(Math.abs(u) * 10);
  return n === 0 ? S.straight : `${side(u)} ${n}`;
}
