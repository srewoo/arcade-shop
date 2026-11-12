// Pure helpers over game state used by the renderer and HUD (no drawing).
import { feel } from '../config/feel';
import { HIDDEN, type Board } from '../core/board';
import { LINES_PER_LEVEL } from '../config/tuning';
import type { GameState } from '../core/state';

/** True when any cell sits in the top `dangerRows` visible rows. */
export function isDanger(board: Board): boolean {
  for (let r = 0; r < HIDDEN + feel.dangerRows; r++) {
    if ((board[r] as number[]).some((c) => c !== 0)) return true;
  }
  return false;
}

/** Level used for the sky tint. Zen keeps gravity at level 1 but the sky drifts with lines. */
export const visualLevel = (s: GameState | null): number => {
  if (!s) return 1;
  return s.rules.id === 'zen' ? 1 + Math.floor(s.lines / LINES_PER_LEVEL) : s.level;
};

/** Seconds left on a timed mode's clock, or null when the mode has no limit. */
export function secondsLeft(s: GameState): number | null {
  const limit = s.rules.timeLimitTicks;
  return limit === null ? null : Math.max(0, (limit - s.ticks) / 60);
}

/**
 * For cleared board rows (old indexes), the number of cells each surviving row falls,
 * keyed by its new index. Used to animate the collapse while the sim clears instantly.
 */
export function collapseShifts(cleared: readonly number[], height: number): number[] {
  const shifts = new Array<number>(height).fill(0);
  const set = new Set(cleared);
  for (let o = 0; o < height; o++) {
    if (set.has(o)) continue;
    const below = cleared.filter((r) => r > o).length;
    shifts[o + below] = below;
  }
  return shifts;
}
