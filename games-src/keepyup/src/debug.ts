// Debug hooks, installed only with ?debug=1.
import { CONFIG } from './config';
import type { Game } from './game';

export interface DebugFlags { autopilot: boolean }

/** Tap point that nudges the lowest falling ball toward the middle; null when nothing to do. */
export function autopilotTap(game: Game): { x: number; y: number } | null {
  const r = CONFIG.ball.radius;
  let low = null as (typeof game.sim.balls)[number] | null;
  for (const b of game.sim.balls) if (b.active && b.vy > 0 && (!low || b.y > low.y)) low = b;
  if (!low || low.y < CONFIG.world.groundY - 250) return null;
  const lean = Math.max(-1, Math.min(1, (low.x - game.width / 2) / (game.width / 2)));
  return { x: low.x + lean * r * 0.7, y: low.y + r * 0.5 };
}

export function installDebug(game: Game, particles: () => number): DebugFlags {
  const flags: DebugFlags = { autopilot: false };
  (window as unknown as Record<string, unknown>).__keepyup = {
    game, flags,
    state: () => ({ phase: game.phase, mode: game.mode, score: game.sim.score, time: game.sim.time, wind: game.sim.windNow, gravity: game.sim.gravity, particles: particles(), balls: game.sim.balls.map((b) => ({ x: b.x, y: b.y, active: b.active })) }),
    autopilot: (on = true) => { flags.autopilot = on; },
    setBest: (m: 'classic' | 'twoballs' | 'windy', n: number) => {
      game.best = { ...game.best, [m]: n };
      if (game.phase === 'title') game.setMode(game.mode); // re-render the title so lock labels refresh
    },
  };
  return flags;
}
