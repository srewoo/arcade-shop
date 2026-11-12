// Pin deck layout (pins numbered 1-10 as in the rule book) and spare-challenge leaves.
import { HEAD_Y, PIN_COUNT, PIN_SPACING, ROW_SPACING } from './constants';

export type PinMask = readonly boolean[];

export interface PinSpot {
  readonly x: number;
  readonly y: number;
}

/** Position of pin index 0..9 (pin number = index + 1). Pin 7 is back-left, 10 back-right. */
export function pinSpot(index: number): PinSpot {
  let row = 0;
  let first = 0;
  while (index >= first + row + 1) {
    first += row + 1;
    row += 1;
  }
  const col = index - first;
  return { x: (col - row / 2) * PIN_SPACING, y: HEAD_Y + row * ROW_SPACING };
}

export const fullRack = (): boolean[] => Array.from({ length: PIN_COUNT }, () => true);

export const countStanding = (mask: PinMask): number => mask.filter(Boolean).length;

export function maskFromNumbers(numbers: readonly number[]): boolean[] {
  const mask = Array.from({ length: PIN_COUNT }, () => false);
  for (const n of numbers) mask[n - 1] = true;
  return mask;
}

/** Classic spare leaves (pin numbers still standing). */
export const SPARE_LEAVES: readonly (readonly number[])[] = [
  [10], [7], [4], [6], [2, 8], [3, 9], [4, 5], [5, 6], [1, 3], [1, 2, 4],
  [4, 6], [2, 7], [3, 10], [7, 10], [4, 7, 10], [2, 4, 5], [3, 6, 10], [5, 7], [5, 10], [2, 4, 7],
  [1, 5, 9], [6, 7, 10], [4, 6, 7, 10], [1, 2, 4, 7],
];
