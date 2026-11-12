// Pure HUD helpers: which stat is the headline, and when the clock turns urgent.
export const URGENT_SECONDS = 10;

/** The score-like stat is drawn largest. */
export const isPrimaryStat = (label: string): boolean => label === 'Score' || label === 'Shots';

/** A "12.3s" clock value under the urgency threshold. */
export function isUrgentClock(label: string, value: string): boolean {
  if (label !== 'Time') return false;
  const n = parseFloat(value);
  return Number.isFinite(n) && n < URGENT_SECONDS;
}
