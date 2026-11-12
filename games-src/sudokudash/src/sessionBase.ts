// Session data and read-only views. The behaviour (input, hints, solver, pause) is in session.ts.
import { isLocked, newGame, type GameState } from './core/game';
import { emptyHistory, type History } from './core/history';
import { dashStart, type DashState } from './core/scoring';
import type { Difficulty } from './core/grader';
import type { Mode } from './storage';
import type { Restored } from './savedGame';
import type { Hint } from './core/hint';
import type { Sfx } from './config/audio';
import { DashRules } from './dashRules';
import type { LossReason, NewGameInit, PauseReason, SessionEvent, Status } from './sessionTypes';

export abstract class SessionBase {
  game: GameState;
  history: History<GameState> = emptyHistory();
  readonly mode: Mode;
  readonly difficulty: Difficulty;
  readonly daily: string | null;
  readonly custom: boolean;
  readonly mistakeLimit: boolean;
  readonly rules: DashRules | null;
  readonly mistakeCells = new Set<number>();
  mistakes = 0;
  elapsedMs = 0;
  hintsUsed = 0;
  assisted = false;
  status: Status = 'playing';
  pauseReason: PauseReason | null = null;
  lossReason: LossReason | null = null;
  finalScore = 0;
  selected = 40;
  notesMode = false;
  hint: Hint | null = null;
  /** True when the hint on screen was already applied (Solve step). */
  hintApplied = false;
  autoRemoveNotes = true;

  constructor(init: NewGameInit | Restored, protected readonly emit: (e: SessionEvent) => void) {
    if ('state' in init) {
      this.game = init.state;
      this.mistakes = init.mistakes;
      this.elapsedMs = init.elapsedMs;
      this.hintsUsed = init.hintsUsed;
      this.assisted = init.assisted;
      this.rules = init.dash ? new DashRules(init.dash, init.awarded, init.bestCombo) : null;
      init.mistakeCells.forEach((c) => this.mistakeCells.add(c));
    } else {
      this.game = newGame(init.puzzle, init.solution);
      this.rules = init.mode === 'dash' ? new DashRules(dashStart(init.difficulty)) : null;
    }
    this.mode = init.mode;
    this.difficulty = init.difficulty;
    this.daily = init.daily;
    this.custom = init.custom;
    this.mistakeLimit = init.mistakeLimit;
    const firstOpen = this.game.values.findIndex((v) => v === 0);
    this.selected = firstOpen >= 0 ? firstOpen : 40;
  }

  get dash(): DashState | null {
    return this.rules?.state ?? null;
  }

  get playing(): boolean {
    return this.status === 'playing';
  }

  get cellLocked(): boolean {
    return isLocked(this.game, this.selected);
  }

  /** Records only count for unassisted wins of generated (non-custom) puzzles. */
  get eligibleForRecords(): boolean {
    return this.status === 'won' && !this.assisted && !this.custom;
  }

  /** Dash numbers for the end card. */
  get dashBreakdown(): { base: number; bonus: number; bestCombo: number } | null {
    if (!this.rules) return null;
    return { base: this.rules.state.score - this.rules.bonus, bonus: this.rules.bonus, bestCombo: this.rules.bestCombo };
  }

  /** The play state that is worth persisting or replaying. */
  toRestored(): Restored {
    return {
      state: this.game, mode: this.mode, difficulty: this.difficulty, daily: this.daily, custom: this.custom,
      mistakes: this.mistakes, mistakeLimit: this.mistakeLimit, elapsedMs: this.elapsedMs,
      hintsUsed: this.hintsUsed, assisted: this.assisted, dash: this.dash,
      awarded: [...(this.rules?.awarded ?? [])], bestCombo: this.rules?.bestCombo ?? 0, mistakeCells: [...this.mistakeCells],
    };
  }

  protected changed(): void {
    this.emit({ type: 'change' });
  }

  protected sfx(name: Sfx): void {
    this.emit({ type: 'sfx', name });
  }

  protected emitAll(events: readonly SessionEvent[]): void {
    events.forEach((e) => this.emit(e));
  }
}
