// One play session: input, hints, solver, pause and the win/loss rules. No DOM; the UI
// subscribes via `emit`. Data lives in SessionBase, Dash scoring in DashRules.
import { CELLS } from './core/grid';
import { eraseCell, enterDigit, isSolved, toggleNote, type GameState } from './core/game';
import { applyHint, nextHint, type Hint } from './core/hint';
import { record, redo, undo, type History } from './core/history';
import { CLASSIC_MISTAKE_LIMIT, classicScore } from './core/scoring';
import { completedHouseCells, eraseWrong, newlyCorrect, solveAllState } from './core/solverActions';
import type { Sfx } from './config/audio';
import { SessionBase } from './sessionBase';
import { STR } from './strings';
import type { LossReason, PauseReason } from './sessionTypes';

export type { LossReason, NewGameInit, PauseReason, SessionEvent, Status } from './sessionTypes';

export class Session extends SessionBase {
  select(cell: number): void {
    if (cell < 0 || cell >= CELLS) return;
    this.selected = cell;
    this.changed();
  }

  move(dRow: number, dCol: number): void {
    const r = Math.min(8, Math.max(0, Math.floor(this.selected / 9) + dRow));
    const c = Math.min(8, Math.max(0, (this.selected % 9) + dCol));
    this.select(r * 9 + c);
  }

  toggleNotesMode(): void {
    this.notesMode = !this.notesMode;
    this.changed();
  }

  private commit(next: GameState): void {
    this.history = record(this.history, this.game);
    this.game = next;
  }

  input(digit: number): void {
    if (!this.playing) return;
    const cell = this.selected;
    if (this.notesMode) {
      const next = toggleNote(this.game, cell, digit);
      if (next !== this.game) {
        this.commit(next);
        this.sfx('note');
      }
      this.changed();
      return;
    }
    const { state, outcome } = enterDigit(this.game, cell, digit, this.autoRemoveNotes);
    if (outcome === 'noop') {
      this.sfx('tap');
      return;
    }
    this.commit(state);
    this.hint = null;
    if (outcome === 'correct') this.onCorrect(cell);
    else this.onMistake(cell);
    if (this.playing && isSolved(this.game)) this.finish(true);
    this.changed();
  }

  private onCorrect(cell: number): void {
    this.sfx('correct');
    const house = completedHouseCells(this.game, cell);
    if (house.length > 0) this.emit({ type: 'house', cells: house });
    if (this.rules) this.emitAll(this.rules.correct(cell, this.elapsedMs, this.difficulty));
  }

  private onMistake(cell: number): void {
    this.mistakes++;
    this.mistakeCells.add(cell);
    this.sfx('mistake');
    this.emit({ type: 'mistake', cell });
    if (this.rules) {
      this.emitAll(this.rules.mistake(cell));
      if (this.rules.timeUp) this.finish(false, 'time');
      return;
    }
    this.emit({ type: 'announce', text: this.mistakeLimit ? STR.strike(this.mistakes, CLASSIC_MISTAKE_LIMIT) : STR.announce.wrong });
    if (this.mistakeLimit && this.mistakes >= CLASSIC_MISTAKE_LIMIT) this.finish(false, 'mistakes');
  }

  erase(): void {
    if (!this.playing) return;
    const next = eraseCell(this.game, this.selected);
    if (next === this.game) return;
    this.commit(next);
    this.sfx('erase');
    this.changed();
  }

  undo(): void {
    this.stepHistory(undo(this.history, this.game), 'undo');
  }

  redo(): void {
    this.stepHistory(redo(this.history, this.game), 'redo');
  }

  private stepHistory(r: { history: History<GameState>; state: GameState } | null, cue: Sfx): void {
    if (!this.playing || !r) return;
    this.history = r.history;
    this.game = r.state;
    this.hint = null;
    this.sfx(cue);
    this.changed();
  }

  requestHint(): void {
    if (!this.playing) return;
    const hint = nextHint(this.game);
    this.hint = hint;
    this.hintApplied = false;
    this.hintsUsed++;
    if (this.rules) {
      this.emitAll(this.rules.hint());
      if (this.rules.timeUp) this.finish(false, 'time');
    }
    if (hint.kind === 'mistake') this.selected = hint.cell;
    if (hint.kind === 'step' && hint.step.placement) this.selected = hint.step.placement.cell;
    this.sfx('hint');
    this.changed();
  }

  dismissHint(): void {
    if (!this.hint) return;
    this.hint = null;
    this.changed();
  }

  /** Apply the hint being shown (placements are free of score). */
  applyCurrentHint(): void {
    if (!this.playing || !this.hint) return;
    this.applyAndCheck(this.hint);
    this.hint = null;
    this.changed();
  }

  private applyAndCheck(hint: Hint): void {
    const before = this.game;
    const next = applyHint(before, hint);
    if (next === before) return;
    this.commit(next);
    this.rules?.markFree(newlyCorrect(before, next));
    this.sfx('correct');
    if (isSolved(this.game)) this.finish(true);
  }

  /** The solver feature: apply the next logical step (marks the game as assisted). */
  solveStep(): void {
    if (!this.playing) return;
    const hint = nextHint(this.game);
    if (hint.kind === 'mistake') this.commit(eraseWrong(this.game));
    else this.applyAndCheck(hint);
    this.assisted = true;
    this.hint = hint.kind === 'step' || hint.kind === 'guess' ? hint : null;
    this.hintApplied = true;
    this.changed();
  }

  solveAll(): void {
    if (!this.playing) return;
    this.assisted = true;
    this.commit(solveAllState(this.game));
    this.hint = null;
    this.sfx('solve');
    this.finish(true);
    this.changed();
  }

  tick(dtMs: number): void {
    if (!this.playing) return;
    this.elapsedMs += dtMs;
    if (this.rules) {
      this.emitAll(this.rules.tick(dtMs));
      if (this.rules.timeUp) this.finish(false, 'time');
    }
    this.emit({ type: 'tick' });
  }

  pause(reason: PauseReason = 'manual'): void {
    if (this.status === 'paused' && reason === 'ready') this.pauseReason = 'ready';
    if (!this.playing) return;
    this.status = 'paused';
    this.pauseReason = reason;
    if (reason === 'manual') this.sfx('pause');
    this.emit({ type: 'announce', text: STR.announce.paused });
    this.changed();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    const wasReady = this.pauseReason === 'ready';
    this.status = 'playing';
    this.pauseReason = null;
    this.sfx(wasReady ? 'start' : 'resume');
    this.emit({ type: 'announce', text: STR.announce.resumed });
    this.changed();
  }

  private finish(won: boolean, reason?: LossReason): void {
    this.status = won ? 'won' : 'lost';
    this.lossReason = reason ?? null;
    if (won) this.rules?.payBonus(this.assisted);
    if (this.rules) this.finalScore = this.rules.state.score;
    else this.finalScore = won ? classicScore(this.difficulty, this.elapsedMs, this.mistakes, this.hintsUsed) : 0;
    this.sfx(won ? 'win' : 'lose');
    this.emit({ type: 'end' });
  }
}
