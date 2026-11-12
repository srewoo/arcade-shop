// Debug hook for automated checks. Only installed in dev builds or with ?debug=1.
import { ITEM_CRUMB, ITEM_SUGAR } from './maze';
import { startDrench } from './modes';
import { renderAudioPeaks } from './debugAudio';
import type { Game } from './flow';

export interface CrumbDebug {
  godMode: boolean;
  clearLevel(): void;
  drench(seconds?: number): void;
  teleportPip(col: number, row: number): void;
  killPip(): void;
  state(): Record<string, unknown>;
  /** Peak level (dBFS) of every sound, rendered offline through the real graph. */
  audioPeaks(): Promise<Record<string, number>>;
  /** Fast-forward the simulation by `seconds` without rendering. */
  advance(seconds: number): void;
  /** Grant points through the normal scoring rules (extra lives at 7,500 and 25,000). */
  grant(points: number): void;
}

export function debugEnabled(): boolean {
  return import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1';
}

function debugState(game: Game): Record<string, unknown> {
  const w = game.world;
  return {
    phase: game.phase, level: game.level, score: w.score.score, lives: w.score.lives, hi: game.hi,
    remaining: w.remaining, drench: w.drench.left, paused: game.paused, frozen: game.frozen, muted: game.muted,
    autoPaused: game.autoPaused, reducedMotion: game.reducedMotion, time: w.time, clock: w.clock.phase,
    pip: { x: w.pip.x, y: w.pip.y, dir: w.pip.dir, alive: w.pip.alive },
    cats: w.cats.map((c) => ({ kind: c.kind, mode: c.mode, x: c.x, y: c.y, pouncing: c.pouncing, pounce: c.pounce.phase })),
    cheese: w.cheese.active, maze: w.maze.name,
  };
}

export function installDebug(game: Game): void {
  const api: CrumbDebug = {
    get godMode() {
      return game.world.god;
    },
    set godMode(v: boolean) {
      game.world.god = v;
    },
    clearLevel() {
      const w = game.world;
      w.items.forEach((it, i) => {
        if (it === ITEM_CRUMB || it === ITEM_SUGAR) w.items[i] = 0;
      });
      w.remaining = 0;
      w.cleared = true;
      w.events.push({ type: 'clear' });
    },
    drench(seconds) {
      startDrench(game.world.drench, seconds ?? game.world.tuning.drenchSec);
    },
    teleportPip(col, row) {
      game.world.pip.x = col;
      game.world.pip.y = row;
      game.world.pip.dir = 'N';
    },
    killPip() {
      const w = game.world;
      for (const c of w.cats) {
        c.mode = 'active';
        c.x = w.pip.x;
        c.y = w.pip.y;
      }
    },
    audioPeaks: renderAudioPeaks,
    grant(points) {
      game.grant(points);
    },
    advance(seconds) {
      for (let i = 0; i < Math.round(seconds * 60); i++) {
        game.update(1 / 60);
        game.world.events.length = 0;
      }
    },
    state: () => debugState(game),
  };
  (window as unknown as { __crumb: CrumbDebug }).__crumb = api;
}
