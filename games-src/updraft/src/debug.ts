// Test hooks, only installed with ?debug=1.
import { botHold } from './bot';
import type { Game } from './game';

export interface DebugState { phase: string; seed: string; dist: number; y: number; vy: number; coins: number; score: number; tick: number; alive: boolean; ghost: boolean; particles: number }

export function installDebug(game: Game, particles: () => number): { autopilot: boolean } {
  const flags = { autopilot: false };
  const api = {
    flags,
    state: (): DebugState => ({
      phase: game.phase, seed: game.run?.seedKey ?? '', dist: game.run?.sim.dist ?? 0, y: game.run?.sim.y ?? 0,
      vy: game.run?.sim.vy ?? 0, coins: game.run?.sim.coinCount ?? 0, score: game.run?.score ?? 0,
      tick: game.run?.sim.tick ?? 0, alive: game.run?.sim.alive ?? false, ghost: game.hasGhost, particles: particles(),
    }),
    autopilot: (on: boolean): void => { flags.autopilot = on; },
    /** Free span around the craft, so an external driver can steer. */
    span: (ahead = 75): [number, number] | null => {
      const r = game.run;
      return r ? [...r.world.freeSpan(r.sim.dist + ahead)] as [number, number] : null;
    },
  };
  (window as unknown as { __updraft: typeof api }).__updraft = api;
  return flags;
}

export const autopilotHold = (game: Game): boolean | null =>
  game.run && game.phase === 'playing' ? botHold(game.run.world, game.run.sim) : null;
