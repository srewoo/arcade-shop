// Game controller: turns taps into moves, keeps the clock honest, reports outcomes. No DOM queries here.
import type { BoardSpec, Move } from './board';
import { Clock } from './clock';
import { CONFIG } from './config';
import { escalate, type HintStage } from './hints';
import { Session, type Status } from './session';
import type { Sfx } from './audioCues';
import { S } from './strings';
import type { BoardView } from './ui/boardView';

export interface Summary {
  readonly moves: number;
  readonly optimal: number;
  readonly ms: number;
  readonly stars: 1 | 2 | 3;
  readonly undos: number;
  readonly hints: number;
}

export interface PlayHooks {
  readonly say: (message: string) => void;
  readonly sfx: (name: Sfx) => void;
  readonly changed: () => void;
  readonly celebrate: () => void;
  readonly won: (s: Summary) => void;
  readonly stuck: () => void;
}

export class Play {
  session: Session | null = null;
  selected: number | null = null;
  hintMove: Move | null = null;
  private readonly clock = new Clock();
  private hintTimer = 0;
  private blocked = false;
  private hintStage: HintStage = 'none';

  constructor(private readonly view: BoardView, private readonly hooks: PlayHooks) {}

  get status(): Status {
    return this.session?.status ?? 'idle';
  }
  get active(): boolean {
    return this.session !== null && this.status !== 'won';
  }
  elapsed(): number {
    return this.clock.elapsed(performance.now());
  }

  start(spec: BoardSpec): void {
    this.session = new Session(spec);
    this.clock.reset();
    this.selected = null;
    this.clearHint();
    this.view.build(spec, spec.start);
    this.hooks.say(S.ready);
    this.render();
  }

  restart(): void {
    if (!this.session) return;
    this.start(this.session.spec);
  }

  /** Clock runs only while a run is in progress and nothing (menu, overlay, hidden tab) interrupts it. */
  setPaused(paused: boolean): void {
    this.blocked = paused;
    this.syncClock();
  }

  private syncClock(): void {
    const running = !this.blocked && this.status === 'playing';
    if (running) this.clock.start(performance.now());
    else this.clock.stop(performance.now());
  }

  activate(index: number): void {
    const s = this.session;
    if (!s || s.status === 'won' || this.blocked) return;
    this.clearHint();
    const own = s.movesOf(index);
    const piece = s.state[index] !== '.';
    if (this.selected !== null) return this.activateSelected(index, own);
    if (piece) {
      if (own.length === 0) return this.deny(index, S.blocked);
      if (own.length === 1) return this.hop(own[0] as Move);
      return this.select(index);
    }
    const into = [...s.state].flatMap((_, i) => s.movesOf(i)).filter((m) => m.to === index);
    if (into.length === 1) return this.hop(into[0] as Move);
    this.deny(index, into.length === 0 ? S.noPiece : S.ambiguous);
  }

  private activateSelected(index: number, own: Move[]): void {
    const from = this.selected as number;
    const mine = this.session?.movesOf(from).find((m) => m.to === index);
    if (mine) return this.hop(mine);
    if (index === from) return this.select(null);
    if (own.length > 0) return this.select(index);
    this.deny(index, S.blocked);
  }

  private select(index: number | null): void {
    this.selected = index;
    this.hooks.sfx('tap');
    this.hooks.say(index === null ? S.ready : S.selected);
    this.render();
  }

  private deny(index: number, message: string): void {
    this.view.denyShake(index);
    this.hooks.sfx('deny');
    this.hooks.say(message);
  }

  private hop(move: Move): void {
    const s = this.session as Session;
    const result = s.play(move);
    if (!result.ok) return;
    this.selected = null;
    this.view.move(move, true);
    this.view.focusPad(move.to);
    this.hooks.sfx(result.jump ? 'jump' : 'step');
    this.syncClock();
    this.afterMove(result.status);
  }

  private afterMove(status: Status): void {
    const s = this.session as Session;
    this.render();
    if (status === 'won') {
      const summary = { moves: s.moves, optimal: s.optimal, ms: this.clock.elapsed(performance.now()), stars: s.stars, undos: s.undos, hints: s.hints };
      this.hooks.say(S.win(s.moves, s.optimal, s.hints));
      this.view.celebrate();
      this.hooks.celebrate();
      const delay = this.view.isReduced() ? CONFIG.timing.winDelayReducedMs : CONFIG.timing.winDelayMs;
      window.setTimeout(() => this.hooks.won(summary), delay);
    } else if (status === 'stuck') {
      this.hooks.sfx('stuck');
      this.hooks.say(S.stuckSr);
      this.hooks.stuck();
    } else {
      this.hooks.say(S.playing(s.moves));
    }
  }

  undo(): void {
    const s = this.session;
    if (!s || s.status === 'won') return;
    const m = s.undo();
    if (!m) return this.hooks.say(S.nothingToUndo);
    this.selected = null;
    this.clearHint();
    this.view.move({ from: m.to, to: m.from, over: m.over }, true);
    this.hooks.sfx('undo');
    this.hooks.say(S.undone);
    this.syncClock();
    this.render();
  }

  hint(): void {
    const s = this.session;
    if (!s || s.status === 'won') return;
    const step = escalate(this.hintMove ? this.hintStage : 'none');
    const m = step.counts ? s.hint() : this.hintMove;
    if (!m) return this.hooks.say(S.noHint);
    this.hintMove = m;
    this.hintStage = step.stage;
    this.selected = null;
    this.hooks.sfx('hint');
    this.hooks.say(step.stage === 'piece' ? S.hintPiece : S.hintShown);
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.clearHint(), step.stage === 'piece' ? CONFIG.timing.hintPieceMs : CONFIG.timing.hintMs);
    this.render();
  }

  private clearHint(): void {
    if (this.hintMove === null) return;
    this.hintMove = null;
    this.hintStage = 'none';
    window.clearTimeout(this.hintTimer);
    this.render();
  }

  targets(): number[] {
    const s = this.session;
    return s && this.selected !== null ? s.movesOf(this.selected).map((m) => m.to) : [];
  }

  render(): void {
    const s = this.session;
    if (!s) return;
    this.view.refresh(s.state, (i) => s.movesOf(i).length > 0, this.selected, this.targets(), this.hintMove, this.hintStage === 'full');
    this.hooks.changed();
  }
}
