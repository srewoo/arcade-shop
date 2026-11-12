// Test hooks, only installed with ?debug=1: window.__zapchain.
import type { Game } from './game';
import { BOMB, type Kind } from './model/types';
import { makeTile } from './model/world';

export interface DebugFlags { autopilot: boolean }

export function installDebug(game: Game, particles: () => number): DebugFlags {
  const flags: DebugFlags = { autopilot: false };
  const api = {
    flags,
    state: () => ({
      phase: game.phase, level: game.level, score: game.score, best: game.scores.best,
      cleared: game.sim?.cleared ?? 0, toGo: game.sim?.toGo ?? 0, remaining: game.sim?.remaining ?? 0,
      tiles: game.sim?.tiles.length ?? 0, busy: game.sim?.busy ?? false, status: game.sim?.status ?? 'none', particles: particles(),
    }),
    /** The resting grid as 11 strings (rows 1..11), digits for colours, B for a bomb. */
    grid: (): string[] => {
      const sim = game.scene;
      return sim.cells.slice(1).map((row) => row.map((t) => (t ? (t.kind === BOMB ? 'B' : String(t.kind)) : '.')).join(''));
    },
    zap: (col: number, row: number): boolean => game.zapAt(col, row),
    autoplay: (on: boolean): void => { flags.autopilot = on; },
    /** Make the current level one zap from done / one second from time-up (to test the end screens). */
    nearWin: (): void => { if (game.sim) (game.sim.params as { target: number }).target = game.sim.cleared + 2; },
    nearTimeUp: (): void => { if (game.sim) (game.sim.params as { seconds: number }).seconds = game.sim.elapsed + 1; },
    /** Swap the disc at (col,row) for a bomb. */
    placeBomb: (col: number, row: number): boolean => {
      const sim = game.sim;
      const old = sim?.cells[row]?.[col];
      if (!sim || !old) return false;
      const b = makeTile(sim.w, BOMB, col, row);
      sim.cells[row]![col] = b;
      sim.w.all[sim.w.all.indexOf(old)] = b;
      sim.w.version++;
      return true;
    },
    /** Stack column `col` to the top so the next feeder drop into it ends the run. */
    fillColumn: (col: number): void => {
      const sim = game.sim;
      if (!sim) return;
      for (let r = 1; r <= 11; r++) {
        if (sim.cells[r]![col]) continue;
        const t = makeTile(sim.w, ((r + col) % 2 === 0 ? 1 : 2) as Kind, col, r);
        sim.cells[r]![col] = t;
        sim.w.all.push(t);
      }
    },
  };
  (window as unknown as { __zapchain: typeof api }).__zapchain = api;
  return flags;
}

/** One greedy move for the autopilot (debug only). */
export const autopilotMove = (game: Game): void => {
  if (game.phase === 'playing') game.autoplayOnce();
};
