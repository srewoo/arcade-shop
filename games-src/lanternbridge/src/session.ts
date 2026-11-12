// One attempt at one level: selection, history (undo), hints and outcome.
// Pure and DOM-free so the rules around it are unit-testable.
import { applyMove, carrierBank, checkMove, initialState, isWon } from './puzzle/engine';
import { solve } from './puzzle/solver';
import { isDeadEnd, rate } from './puzzle/stars';
import type { Level, MoveCheck, State } from './puzzle/types';

export type Outcome = 'playing' | 'won' | 'lost';

export interface Session {
  readonly level: Level;
  state(): State;
  selected(): readonly number[];
  outcome(): Outcome;
  hintsUsed(): number;
  stars(): number;
  canUndo(): boolean;
  stuck(): boolean;
  /** Moves made so far, oldest first. */
  log(): readonly (readonly number[])[];
  toggle(i: number): 'selected' | 'deselected' | 'wrong-side' | 'full' | 'locked';
  cross(): MoveCheck;
  undo(): boolean;
  restart(): void;
  /** Select the first move of an optimal route; null when no route fits any more. */
  hint(): readonly number[] | null;
}

type ToggleResult = ReturnType<Session['toggle']>;

function toggleSelection(level: Level, s: State, selected: readonly number[], i: number): { result: ToggleResult; selected: readonly number[] } {
  if (selected.includes(i)) return { result: 'deselected', selected: selected.filter((x) => x !== i) };
  if ((carrierBank(level, s) & (1 << i)) === 0) return { result: 'wrong-side', selected };
  if (selected.length >= level.capacity) return { result: 'full', selected };
  return { result: 'selected', selected: [...selected, i].sort((a, b) => a - b) };
}

class AttemptSession implements Session {
  private states: State[];
  private moves: number[][] = [];
  private picked: readonly number[] = [];
  private hints = 0;
  private result: Outcome = 'playing';

  constructor(readonly level: Level) {
    this.states = [initialState(level)];
  }

  state = (): State => this.states[this.states.length - 1] as State;
  selected = (): readonly number[] => this.picked;
  outcome = (): Outcome => this.result;
  hintsUsed = (): number => this.hints;
  canUndo = (): boolean => this.states.length > 1;
  log = (): readonly (readonly number[])[] => this.moves;
  stars = (): number => (this.result === 'won' ? rate(this.level, this.state().cost, this.hints) : 0);
  stuck = (): boolean => this.result === 'playing' && isDeadEnd(this.level, this.state());

  private judge(): Outcome {
    const s = this.state();
    if (this.level.limit !== null && s.cost > this.level.limit) return 'lost';
    return isWon(s) ? 'won' : 'playing';
  }

  toggle(i: number): ToggleResult {
    if (this.result !== 'playing') return 'locked';
    const next = toggleSelection(this.level, this.state(), this.picked, i);
    this.picked = next.selected;
    return next.result;
  }

  cross(): MoveCheck {
    if (this.result !== 'playing') return { ok: false, reason: 'empty' };
    const check = checkMove(this.level, this.state(), this.picked);
    if (!check.ok) return check;
    this.states = [...this.states, applyMove(this.level, this.state(), this.picked)];
    this.moves = [...this.moves, [...this.picked]];
    this.picked = [];
    this.result = this.judge();
    return check;
  }

  undo(): boolean {
    if (this.states.length <= 1) return false;
    this.states = this.states.slice(0, -1);
    this.moves = this.moves.slice(0, -1);
    this.picked = [];
    this.result = this.judge();
    return true;
  }

  restart(): void {
    this.states = [initialState(this.level)];
    this.moves = [];
    this.picked = [];
    this.hints = 0;
    this.result = 'playing';
  }

  hint(): readonly number[] | null {
    const open = this.result === 'playing' && !isDeadEnd(this.level, this.state());
    const group = open ? solve(this.level, this.state())?.path[0] : undefined;
    if (!group) return null;
    this.hints += 1;
    this.picked = [...group];
    return group;
  }
}

export const createSession = (level: Level): Session => new AttemptSession(level);
