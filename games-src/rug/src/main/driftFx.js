// Drift sparks at the rear wheels; colour follows the mini-turbo tier the drift has reached.
import { sparkColor } from "../logic/drift.js";
import { particles } from "./bootstrap.js";

const rgbCache = new Map();
function rgbOf(hex) {
  if (!rgbCache.has(hex)) {
    const n = parseInt(hex.slice(1), 16);
    rgbCache.set(hex, [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]);
  }
  return rgbCache.get(hex);
}

/** Emit this frame's sparks for the player's active drift (no-op otherwise). */
export function updateDriftFx(session, player) {
  const drift = session.drift;
  if (!drift || !player.onGround || !drift.state.active) return;
  const color = rgbOf(sparkColor(drift.state.duration));
  const cos = Math.cos(player.a);
  const sin = Math.sin(player.a);
  for (const side of [1.3, -1.3]) {
    const x = player.x - cos * 1.85 - sin * side;
    const z = player.z - sin * 1.85 + cos * side;
    particles.sparks(x, z, player.vx, player.vz, color, 2);
  }
}
