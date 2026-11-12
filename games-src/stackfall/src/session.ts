// Run state machine and fixed 60 Hz stepping (DOM-free, unit-tested).
import { TICKS_PER_SECOND } from './config/tuning';
import { createGame, tick } from './core/step';
import type { GameConfig, GameEvent, GameState, TickInput } from './core/state';
import { snapOf, type PieceSnap } from './ui/interp';

export const STEP = 1 / TICKS_PER_SECOND;
export const MAX_CATCHUP_STEPS = 6;
export type Phase = 'title' | 'playing' | 'paused' | 'ended';

export interface SessionHooks {
  onEvents(events: readonly GameEvent[], game: GameState): void;
  onEnd(status: 'won' | 'over' | 'time'): void;
}

export class Session {
  game: GameState | null = null;
  phase: Phase = 'title';
  prev: PieceSnap | null = null;
  private acc = 0;

  constructor(private readonly poll: () => TickInput, private readonly hooks: SessionHooks) {}

  /** Interpolation factor for rendering between the previous and current step. */
  get alpha(): number {
    return this.phase === 'playing' ? this.acc / STEP : 1;
  }

  start(cfg: GameConfig): void {
    this.game = createGame(cfg);
    this.phase = 'playing';
    this.acc = 0;
    this.prev = null;
    this.drain(this.game);
  }

  toTitle(): void {
    this.game = null;
    this.phase = 'title';
    this.prev = null;
  }

  pause(): boolean {
    if (this.phase !== 'playing') return false;
    this.phase = 'paused';
    return true;
  }

  resume(): boolean {
    if (this.phase !== 'paused') return false;
    this.phase = 'playing';
    this.acc = 0;
    return true;
  }

  /** Visibility loss or window blur: pause only while a run is active. */
  autoPause(): boolean {
    return this.pause();
  }

  /** Advance by `dt` seconds of wall time. Does nothing unless playing. */
  advance(dt: number): void {
    const g = this.game;
    if (this.phase !== 'playing' || !g) return;
    this.acc += dt;
    for (let n = 0; this.acc >= STEP && n < MAX_CATCHUP_STEPS && this.phase === 'playing'; n++) {
      this.acc -= STEP;
      this.prev = snapOf(g.piece, g.piecesPlaced);
      tick(g, this.poll());
      this.drain(g);
    }
    if (this.acc > STEP * MAX_CATCHUP_STEPS) this.acc = 0; // drop a backlog instead of fast-forwarding
  }

  private drain(g: GameState): void {
    if (g.events.length === 0) return;
    const events = g.events.splice(0);
    this.hooks.onEvents(events, g);
    const end = events.find((e) => e.type === 'end');
    if (end && end.type === 'end') {
      this.phase = 'ended';
      this.hooks.onEnd(end.status);
    }
  }
}
