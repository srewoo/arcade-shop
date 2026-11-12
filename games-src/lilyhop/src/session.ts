// One play-through of a board: move history, undo, hint, win/stuck detection. DOM-free.
import { applyMove, isJump, isSolved, movesFrom, type BoardSpec, type Move } from './board';
import { starsFor } from './scoring';
import { solverFor, type Solver } from './solver';

export type Status = 'idle' | 'playing' | 'won' | 'stuck';

export interface MoveResult {
  readonly ok: boolean;
  readonly jump: boolean;
  readonly status: Status;
}

export class Session {
  readonly solver: Solver;
  private states: string[];
  private moveLog: Move[] = [];
  undos = 0;
  hints = 0;

  constructor(readonly spec: BoardSpec) {
    this.solver = solverFor(spec);
    this.states = [spec.start];
  }

  get state(): string {
    return this.states[this.states.length - 1] as string;
  }
  get moves(): number {
    return this.moveLog.length;
  }
  get lastMove(): Move | undefined {
    return this.moveLog[this.moveLog.length - 1];
  }
  get optimal(): number {
    return this.solver.optimal ?? 0;
  }
  get status(): Status {
    if (isSolved(this.spec, this.state)) return 'won';
    if (this.solver.distance(this.state) === undefined) return 'stuck';
    return this.moveLog.length === 0 ? 'idle' : 'playing';
  }
  get stars(): 1 | 2 | 3 {
    return starsFor(this.moves, this.optimal, this.hints);
  }

  movesOf(index: number): Move[] {
    return this.status === 'won' ? [] : movesFrom(this.spec, this.state, index);
  }

  play(move: Move): MoveResult {
    const legal = this.movesOf(move.from).some((m) => m.to === move.to);
    if (!legal) return { ok: false, jump: false, status: this.status };
    const real = this.movesOf(move.from).find((m) => m.to === move.to) as Move;
    this.moveLog.push(real);
    this.states.push(applyMove(this.state, real));
    return { ok: true, jump: isJump(real), status: this.status };
  }

  undo(): Move | undefined {
    const m = this.moveLog.pop();
    if (!m) return undefined;
    this.states.pop();
    this.undos++;
    return m;
  }

  hint(): Move | undefined {
    const m = this.solver.bestMove(this.state);
    if (m) this.hints++;
    return m;
  }

  restart(): void {
    this.states = [this.spec.start];
    this.moveLog = [];
    this.undos = 0;
    this.hints = 0;
  }
}
