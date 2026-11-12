// Test hooks, only installed with ?debug=1.
import { botInput } from './sim/bot';
import type { Game } from './game';
import { applyPower } from './sim/power';
import { POWER_KINDS, type PowerKind } from './sim/types';

export interface DebugState {
  phase: string; stage: number; lives: number; score: number; time: number; bubbles: number; lines: number;
  power: { double: number; sticky: number; slow: number; shield: boolean }; particles: number; tick: number;
}

export function installDebug(game: Game, particles: () => number): { autopilot: boolean } {
  const flags = { autopilot: false };
  const api = {
    flags,
    state: (): DebugState => ({
      phase: game.phase, stage: game.run.stage + 1, lives: game.run.lives, score: game.sim.score, time: game.sim.time,
      bubbles: game.sim.bubbles.length, lines: game.sim.lines.length,
      power: { ...game.sim.power, shield: game.sim.player.shield }, particles: particles(), tick: game.sim.tick,
    }),
    autopilot: (on: boolean): void => { flags.autopilot = on; },
    /** Remove every bubble so the stage clears. */
    clear: (): void => game.debugClear(),
    /** Grant a power-up. */
    power: (kind: string): void => { if ((POWER_KINDS as readonly string[]).includes(kind)) applyPower(game.sim, kind as PowerKind); },
    /** Jump to a stage (0-based) and wait for the first action. */
    stage: (i: number): void => { game.start(); game.run.stage = Math.max(0, Math.floor(i)); game.restageForDebug(); },
    /** Set the sim stage timer in seconds. */
    time: (s: number): void => { game.sim.time = s; },
    /** Make the player invulnerable (for long unattended captures). */
    god: (): void => { game.sim.player.invuln = 9999; },
  };
  (window as unknown as { __splitshot: typeof api }).__splitshot = api;
  return flags;
}

export const autopilotInput = (game: Game): ReturnType<typeof botInput> | null =>
  game.phase === 'playing' || game.phase === 'ready' ? botInput(game.sim) : null;
