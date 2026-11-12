// Play-screen controller: turns taps and keys into rules calls, then reflects
// the new state in the HUD, jugs, gate and announcements.
import { CONFIG } from './config';
import { play as applyPlay, moveCount, newGame, restart as restartGame, undo as undoGame, useHint, type GameState } from './game';
import { emit } from './audio';
import type { Ctx } from './ctx';
import type { LevelDef, Move } from './jugs';
import { describeMove } from './describe';
import { recordBest, saveProgress } from './progress';
import { starsFor } from './scoring';
import { S } from './strings';
import { isReducedMotion } from './ui/appearance';
import { el, elSvg } from './ui/dom';
import { sparkle } from './ui/fx';
import { buildJugs, flashJug, updateJugs } from './ui/jugs';
import { buildScene, setGate, setGoal } from './ui/scene';
import { formatTime } from './timer';

export interface PlayHooks {
  /** Show the win sheet (called after the gate animation). */
  onWin(info: { stars: number; moves: number; par: number; hinted: boolean; best: number | null }): void;
  /** Called after each accepted move. */
  onMove(): void;
}

export class PlayController {
  private readonly jugsHost = el('jugs');
  private readonly scene = elSvg('scene');
  private cancelWin: (() => void) | null = null;

  constructor(
    private readonly ctx: Ctx,
    private readonly hooks: PlayHooks,
  ) {}

  private game = (): GameState => this.ctx.game as GameState;
  private reduced = (): boolean => isReducedMotion(this.ctx.settings.reduceMotion, this.ctx.reducedSystem);
  private say = (text: string): void => void (el('status').textContent = text);

  reflect = (): void => {
    const g = this.game();
    updateJugs(this.jugsHost, g.level.jugs, g.amounts, g.level.goal, this.ctx.picked);
    el('hud-moves').textContent = String(moveCount(g));
    el('hud-time').textContent = formatTime(this.ctx.clock.elapsedMs());
    el<HTMLButtonElement>('act-undo').disabled = moveCount(g) === 0 || g.solved;
    for (const id of ['act-fill', 'act-empty', 'act-hint']) el<HTMLButtonElement>(id).disabled = g.solved;
  };

  start = (level: LevelDef, label: string): void => {
    this.cancelPendingWin();
    this.ctx.game = newGame(level);
    this.ctx.picked = null;
    this.ctx.clock.reset();
    buildScene(this.scene);
    setGoal(this.scene, level.goal);
    setGate(this.scene, false);
    buildJugs(this.jugsHost, level, this.pick);
    el('hud-level').textContent = label;
    el('hud-par').textContent = String(level.par);
    this.say(level.goal.count > 1 ? S.goalTwo(level.goal.amount) : S.goalOne(level.goal.amount));
    this.reflect();
  };

  /** Drop a pending win sheet (leaving the level or restarting during the win delay). */
  cancelPendingWin = (): void => {
    this.cancelWin?.();
    this.cancelWin = null;
  };

  private finish = (): void => {
    const g = this.game();
    this.ctx.clock.stop();
    const moves = moveCount(g);
    const stars = starsFor(moves, g.level.par, g.hintsUsed);
    if (!this.ctx.quick) {
      this.ctx.progress = recordBest(this.ctx.progress, g.level.id, stars, moves);
      saveProgress(this.ctx.progress);
    }
    this.ctx.picked = null;
    this.reflect();
    setGate(this.scene, true);
    emit('win');
    sparkle(el('scene').parentElement as HTMLElement, this.reduced());
    this.say(S.solved(moves, g.level.par));
    const best = this.ctx.quick ? null : (this.ctx.progress[g.level.id]?.moves ?? null);
    const delay = this.reduced() ? CONFIG.fx.winDelayReducedMs : CONFIG.fx.winDelayMs;
    const id = window.setTimeout(() => this.hooks.onWin({ stars, moves, par: g.level.par, hinted: g.hintsUsed > 0, best }), delay);
    this.cancelWin = () => window.clearTimeout(id);
  };

  private commit = (move: Move): boolean => {
    const before = this.game();
    const after = applyPlay(before, move);
    if (after === before) return false;
    this.ctx.game = after;
    if (!this.ctx.clock.running && !after.solved) this.ctx.clock.start();
    this.describeAfter(move, after);
    this.hooks.onMove();
    this.reflect();
    if (after.solved) this.finish();
    return true;
  };

  private describeAfter = (move: Move, g: GameState): void => {
    const n = S.jugName;
    if (move.kind === 'fill') this.say(S.didFill(n(move.jug), g.amounts[move.jug] ?? 0));
    else if (move.kind === 'empty') this.say(S.didEmpty(n(move.jug)));
    else this.say(S.didPour(n(move.from), n(move.to), g.amounts[move.from] ?? 0, g.amounts[move.to] ?? 0));
  };

  private reject = (jug: number | null): void => {
    emit('invalid');
    this.say(S.noEffect);
    if (jug !== null) flashJug(this.jugsHost, jug, 'shake', 320);
  };

  pick = (i: number): void => {
    if (!this.ctx.game || this.game().solved) return;
    const from = this.ctx.picked;
    if (from === null) {
      this.ctx.picked = i;
      emit('select');
      this.say(S.pourWhere(S.jugName(i)));
    } else if (from === i) {
      this.ctx.picked = null;
      emit('click');
      this.say(S.pickJug);
    } else if (this.commit({ kind: 'pour', from, to: i })) {
      this.ctx.picked = null;
      emit('pour');
      flashJug(this.jugsHost, from, 'pouring', CONFIG.fx.pourMs);
      flashJug(this.jugsHost, i, 'receiving', CONFIG.fx.pourMs);
    } else this.reject(i);
    if (this.ctx.game) this.reflect();
  };

  private simple = (kind: 'fill' | 'empty'): void => {
    if (!this.ctx.game || this.game().solved) return;
    const jug = this.ctx.picked;
    if (jug === null) {
      this.say(S.pickJug);
      emit('invalid');
      return;
    }
    if (this.commit({ kind, jug })) emit(kind);
    else this.reject(jug);
  };

  fill = (): void => this.simple('fill');
  empty = (): void => this.simple('empty');

  undo = (): void => {
    if (!this.ctx.game || moveCount(this.game()) === 0) return;
    this.ctx.game = undoGame(this.game());
    this.ctx.picked = null;
    emit('undo');
    this.say(S.didUndo);
    this.reflect();
  };

  hint = (): void => {
    if (!this.ctx.game || this.game().solved) return;
    const { state, move } = useHint(this.game());
    this.ctx.game = state;
    if (!move) {
      this.say(S.hintNone);
      return;
    }
    emit('hint');
    this.say(S.hintMove(describeMove(move)));
    const jugs = move.kind === 'pour' ? [move.from, move.to] : [move.jug];
    jugs.forEach((j) => flashJug(this.jugsHost, j, 'flash', CONFIG.ui.hintFlashMs));
  };

  restart = (): void => {
    if (!this.ctx.game) return;
    const g = restartGame(this.game());
    this.start(g.level, el('hud-level').textContent ?? '');
    this.say(S.restarted);
  };
}
