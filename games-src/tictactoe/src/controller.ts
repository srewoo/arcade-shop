// Turn controller: owns the game state, the CPU timer, pause reasons and the
// one-slot premove. No DOM; timers and the move chooser are injectable so the
// behaviour is unit tested with fake timers.
import { CONFIG } from './config';
import { chooseMove, type Level } from './ai';
import { isOver, newGame, nextToVanish, play, type GameState, type Player, type Variant } from './game';
import type { Settings } from './settings';

export const CPU: Player = 'O';
export type PauseReason = 'manual' | 'auto' | 'settings';
export type MoveSource = 'human' | 'cpu' | 'premove';
export type MoveResult = 'moved' | 'queued' | 'denied';

export interface MoveInfo {
  readonly mover: Player;
  readonly vanished: boolean;
  /** Cell whose mark disappeared with this move (Vanishing), else null. */
  readonly vanishedCell: number | null;
  readonly source: MoveSource;
}

export interface Timers {
  set(fn: () => void, ms: number): number;
  clear(id: number): void;
}

export interface Deps {
  settings(): Pick<Settings, 'opponent' | 'level' | 'variant'>;
  onMove(info: MoveInfo, state: GameState): void;
  /** Any other change that needs a re-render (pause, new round, premove). */
  onChange(): void;
  choose?: (s: GameState, level: Level) => number;
  timers?: Timers;
  delayMs?: number;
}

const defaultTimers: Timers = {
  set: (fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number,
  clear: (id) => globalThis.clearTimeout(id),
};

export class Controller {
  state: GameState;
  starter: Player;
  round = 0;
  history: number[] = [];
  premove: number | null = null;
  private readonly reasons = new Set<PauseReason>();
  private timer: number | undefined;
  private readonly timers: Timers;
  private readonly delay: number;
  private readonly choose: (s: GameState, level: Level) => number;

  constructor(private readonly deps: Deps, variant: Variant, starter: Player) {
    this.timers = deps.timers ?? defaultTimers;
    this.delay = deps.delayMs ?? CONFIG.cpu.delayMs;
    this.choose = deps.choose ?? ((s, level) => chooseMove(s, level));
    this.starter = starter;
    this.state = newGame(variant, starter);
  }

  get paused(): boolean {
    return this.reasons.size > 0;
  }

  hasReason(reason: PauseReason): boolean {
    return this.reasons.has(reason);
  }

  /** True while the CPU owes a move (its turn, game running). */
  get cpuTurn(): boolean {
    return this.deps.settings().opponent === 'cpu' && this.state.turn === CPU && !isOver(this.state);
  }

  /** A round the player would lose by walking away: started, or the CPU is about to open. */
  get inProgress(): boolean {
    return !isOver(this.state) && (this.state.moves > 0 || this.cpuTurn);
  }

  pause(reason: PauseReason): void {
    this.reasons.add(reason);
    this.cancelTimer();
    this.deps.onChange();
  }

  resume(reason: PauseReason): void {
    if (!this.reasons.delete(reason)) return;
    if (!this.paused) this.schedule();
    this.deps.onChange();
  }

  /** Begin a round. `advance` bumps the round counter (Alternate order). */
  newRound(starter: Player, advance: boolean, variant: Variant = this.state.variant): void {
    this.cancelTimer();
    if (advance) this.round += 1;
    this.starter = starter;
    this.history = [];
    this.premove = null;
    this.state = newGame(variant, starter);
    this.deps.onChange();
    this.schedule();
  }

  /** Install a restored round (validated by session.ts). */
  restore(state: GameState, starter: Player, round: number, history: readonly number[]): void {
    this.cancelTimer();
    this.state = state;
    this.starter = starter;
    this.round = round;
    this.history = [...history];
    this.premove = null;
    this.deps.onChange();
    this.schedule();
  }

  humanMove(index: number): MoveResult {
    const s = this.state;
    if (isOver(s) || this.paused || !Number.isInteger(index) || index < 0 || index > 8) return 'denied';
    if (s.board[index] !== null) return 'denied';
    if (this.cpuTurn) {
      this.premove = index;
      this.deps.onChange();
      return 'queued';
    }
    this.apply(index, 'human');
    return 'moved';
  }

  /** Re-arm the CPU timer (call after settings that affect who is to move). */
  schedule(): void {
    this.cancelTimer();
    if (this.paused || !this.cpuTurn) return;
    this.timer = this.timers.set(() => {
      this.timer = undefined;
      if (this.cpuTurn && !this.paused) this.apply(this.choose(this.state, this.deps.settings().level), 'cpu');
    }, this.delay);
  }

  private cancelTimer(): void {
    if (this.timer !== undefined) this.timers.clear(this.timer);
    this.timer = undefined;
  }

  private apply(index: number, source: MoveSource): void {
    const mover = this.state.turn;
    const vanishedCell = nextToVanish(this.state, mover);
    this.state = play(this.state, index);
    this.history.push(index);
    this.deps.onMove({ mover, vanished: vanishedCell !== null, vanishedCell, source }, this.state);
    this.schedule();
    if (source === 'cpu') this.flushPremove();
  }

  /** Play the buffered premove if it is still legal, otherwise drop it. */
  private flushPremove(): void {
    const pending = this.premove;
    this.premove = null;
    if (pending === null) return;
    const ok = !isOver(this.state) && !this.paused && !this.cpuTurn && this.state.board[pending] === null;
    if (ok) this.apply(pending, 'premove');
    else this.deps.onChange();
  }
}
