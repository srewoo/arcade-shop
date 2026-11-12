// Dash-mode rule book for one session: countdown, combo, score and the "pay each cell once"
// rule that closes the undo/redo farm. No DOM, no timers: Session drives it and forwards the
// events these methods return.
import { DASH } from './config/dash';
import type { Difficulty } from './core/grader';
import {
  dashCorrect, dashFinishBonus, dashHint, dashMistake, dashTick, formatSeconds, isTimeUp, type DashState,
} from './core/scoring';
import type { SessionEvent } from './sessionTypes';
import { STR } from './strings';

export class DashRules {
  /** Cells that already paid out (or were filled by a hint/solver); they never pay again. */
  readonly awarded: Set<number>;
  bestCombo: number;
  bonus = 0;
  private lastWholeSecond = Number.POSITIVE_INFINITY;
  private lowAnnounced = false;

  constructor(public state: DashState, awarded: Iterable<number> = [], bestCombo = 0) {
    this.awarded = new Set(awarded);
    this.bestCombo = Math.max(bestCombo, state.combo);
  }

  get timeUp(): boolean {
    return isTimeUp(this.state);
  }

  /** Pays a correct entry once per cell. A cell that already paid returns no events. */
  correct(cell: number, elapsedMs: number, difficulty: Difficulty): SessionEvent[] {
    if (this.awarded.has(cell)) return [];
    this.awarded.add(cell);
    const a = dashCorrect(this.state, elapsedMs, difficulty);
    this.state = a.state;
    this.bestCombo = Math.max(this.bestCombo, a.combo);
    const text = `+${a.points}${a.combo > 1 ? ` x${a.combo}` : ''}`;
    const out: SessionEvent[] = [
      { type: 'popup', cell, text, good: true },
      { type: 'clock', text: `+${formatSeconds(a.seconds)}`, good: true },
    ];
    if (a.combo >= 3) out.push({ type: 'sfx', name: 'combo' }, { type: 'announce', text: STR.announce.combo(a.combo) });
    return out;
  }

  /** Cells filled for free (hint or solver) can never be undone and re-entered for a payout. */
  markFree(cells: readonly number[]): void {
    cells.forEach((c) => this.awarded.add(c));
  }

  mistake(cell: number): SessionEvent[] {
    this.state = dashMistake(this.state);
    const text = `-${DASH.mistakePenaltySeconds}s`;
    return [
      { type: 'popup', cell, text, good: false },
      { type: 'clock', text, good: false },
      { type: 'announce', text: STR.announce.wrongDash(DASH.mistakePenaltySeconds) },
    ];
  }

  hint(): SessionEvent[] {
    this.state = dashHint(this.state);
    return [{ type: 'clock', text: `-${DASH.hintPenaltySeconds}s`, good: false }];
  }

  /** Advances the countdown; returns a tick cue per second in the last seconds and one low-time warning. */
  tick(dtMs: number): SessionEvent[] {
    this.state = dashTick(this.state, dtMs);
    const whole = Math.ceil(this.state.timeLeftMs / 1000);
    const out: SessionEvent[] = [];
    if (whole < this.lastWholeSecond && whole > 0 && whole <= DASH.tickSeconds) out.push({ type: 'sfx', name: 'tick' });
    if (whole > DASH.lowSeconds) this.lowAnnounced = false;
    else if (!this.lowAnnounced && whole > 0) {
      this.lowAnnounced = true;
      out.push({ type: 'announce', text: STR.announce.lowTime(whole) });
    }
    this.lastWholeSecond = whole;
    return out;
  }

  /** Adds the time-left bonus for a win (nothing when the solver helped). */
  payBonus(assisted: boolean): void {
    this.bonus = dashFinishBonus(this.state, assisted);
    this.state = { ...this.state, score: this.state.score + this.bonus };
  }
}
