// Gap-to-neighbour maths for the position HUD. Pure.
import { HUD_TUNING } from "../config/hud.js";

/** Seconds needed to close `progDiff` route samples at `speed` (speed floored so it never explodes). */
export const gapSeconds = (progDiff, speed) =>
  Math.max(0, progDiff) / Math.max(HUD_TUNING.gapSpeedFloor, Math.abs(speed));

/** Cars directly ahead of / behind `player` in `order` (finished-first standings); null at the ends. */
export function neighbours(order, player) {
  const i = order.indexOf(player);
  if (i < 0) return { ahead: null, behind: null };
  return { ahead: order[i - 1] ?? null, behind: order[i + 1] ?? null };
}

/** "+1.2s" / "-0.8s" (always signed, one decimal). */
export const formatGap = (seconds) => `${seconds < 0 || Object.is(seconds, -0) ? "-" : "+"}${Math.abs(seconds).toFixed(1)}s`;
