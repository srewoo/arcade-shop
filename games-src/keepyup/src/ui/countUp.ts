/** Eased integer for a score count-up: 0 at t=0, `target` at or after `durMs` (ease-out cubic). */
export function countUpValue(target: number, elapsedMs: number, durMs: number): number {
  if (target <= 0) return 0;
  const t = Math.min(1, Math.max(0, elapsedMs / durMs));
  return t >= 1 ? target : Math.floor(target * (1 - (1 - t) ** 3));
}
