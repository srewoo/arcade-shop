// A lookahead autopilot: pick the walk direction (left/stay/right) that survives the next ~0.6 s of
// bubble motion, preferring the one that lines the player up under the nearest bubble, then fire.
// Drives the title-screen demo, the debug autopilot and clearability tests.
import { CONFIG } from '../config';
import { circleHitsRect, stepBubble } from './physics';
import type { Sim } from './state';
import type { Bubble, Input } from './types';

const HORIZON = 40;
const MARGIN = 5;

/** Steps until the player (walking `dir` the whole time) would be touched; Infinity when safe. */
function timeToHit(sim: Sim, dir: number): number {
  const sims: Bubble[] = sim.bubbles.map((b) => ({ ...b }));
  const half = CONFIG.player.w / 2;
  let x = sim.player.x;
  const dt = CONFIG.sim.dt;
  const { hitW, hitH } = CONFIG.player;
  for (let k = 1; k <= HORIZON; k++) {
    x = Math.min(CONFIG.world.w - half, Math.max(half, x + dir * CONFIG.player.speed * dt));
    const body = { x: x - hitW / 2 - MARGIN, y: CONFIG.world.floorY - hitH - MARGIN, w: hitW + MARGIN * 2, h: hitH + MARGIN };
    for (const b of sims) {
      stepBubble(b, dt, sim.solids);
      if (circleHitsRect(b.x, b.y, CONFIG.bubble.radius[b.size] ?? 8, body)) return k;
    }
  }
  return Infinity;
}

function nearestTarget(sim: Sim): Bubble | null {
  let best: Bubble | null = null;
  let score = Infinity;
  const px = sim.player.x;
  for (const b of sim.bubbles) {
    const d = Math.abs(b.x - px) + (CONFIG.world.floorY - b.y) * 0.05 + b.size * -6;
    if (d < score) { score = d; best = b; }
  }
  return best;
}

export function botInput(sim: Sim): Input {
  const target = nearestTarget(sim);
  if (!target) return { left: false, right: false, fire: false };
  const px = sim.player.x;
  const want = Math.abs(target.x + target.vx * 0.1 - px) < 6 ? 0 : target.x + target.vx * 0.1 < px ? -1 : 1;
  const options = [want, 0, -1, 1].filter((d, i, a) => a.indexOf(d) === i);
  let dir = 0;
  let bestT = -1;
  for (const d of options) {
    const t = timeToHit(sim, d);
    if (t === Infinity) { dir = d; bestT = Infinity; break; }
    if (t > bestT) { bestT = t; dir = d; }
  }
  const aligned = sim.bubbles.some((b) => Math.abs(b.x - px) < (CONFIG.bubble.radius[b.size] ?? 8) * 0.8);
  return { left: dir < 0, right: dir > 0, fire: aligned && sim.lines.length < 1 };
}
