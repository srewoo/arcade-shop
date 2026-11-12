// Deterministic autoplayer used by tests and the ?debug=1 hook.
import { CONFIG } from '../config';
import type { Input } from './step';
import type { World } from './world';

export function botInput(w: World): Input {
  const live = w.balls.filter((b) => !b.stuck);
  if (live.length === 0) return { targetX: w.field.w / 2, axis: 0, launch: w.phase === 'ready' };
  const lowest = live.reduce((a, b) => (b.y > a.y ? b : a));
  const swing = Math.sin(w.time * CONFIG.bot.aimRate) * CONFIG.bot.aimSwing * (w.paddle.w / 2);
  return { targetX: lowest.x - swing, axis: 0, launch: false };
}
