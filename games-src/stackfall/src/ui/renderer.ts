// Canvas 2D renderer. Reads game state; never mutates it.
import { feel } from '../config/feel';
import { HIDDEN, type Piece } from '../core/board';
import { cellsOf, shapeIndex } from '../core/shapes';
import type { GameEvent, GameState } from '../core/state';
import { BoardAnim } from './anim';
import { Background } from './background';
import { BoardView, type BoardOpts } from './boardView';
import { Effects } from './effects';
import { lerpPiece, type PieceSnap } from './interp';
import { computeLayout, type Layout } from './layout';
import type { MotionProfile } from './motion';
import { drawMini, drawPanels, stashSlot } from './panels';
import { prewarmSprites } from './stones';
import { visualLevel } from './view';

export interface DrawOptions {
  ghost: boolean;
  paused: boolean;
  alpha: number; // accumulator / step, for interpolation
  prev: PieceSnap | null; // piece as of the previous step
}

export class Renderer {
  readonly fx = new Effects();
  private readonly bg = new Background();
  private readonly anim = new BoardAnim();
  private readonly view: BoardView;
  private layout: Layout = computeLayout(400, 700);
  private w = 400;
  private h = 700;
  private dpr = 1;
  private clock = 0;
  private textScale = 1;
  private assist = false;
  private lastPiece = { x: 0, y: 0 };
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.view = new BoardView(this.ctx);
  }

  setMotion(p: MotionProfile): void {
    this.fx.profile = p;
    this.bg.drift = p.tweens;
  }

  setAssist(on: boolean): void {
    this.assist = on;
    this.fx.assist = on;
    this.prewarm();
  }

  setTextScale(scale: number): void {
    this.textScale = scale;
    this.layout = computeLayout(this.w, this.h, scale);
  }

  resize(w: number, h: number, dpr: number): void {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout = computeLayout(this.w, this.h, this.textScale);
    this.prewarm();
  }

  /** Build the stone sprites for the current sizes when the browser is idle. */
  private prewarm(): void {
    const sizes = [this.layout.cell * this.dpr, this.layout.mini * this.dpr];
    const run = (): void => prewarmSprites(sizes, this.assist);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 500 });
    else window.setTimeout(run, 0);
  }

  /** Cell size in CSS px (used for touch gesture thresholds). */
  get cellSize(): number {
    return this.layout.cell;
  }

  get currentLayout(): Layout {
    return this.layout;
  }

  private cellXY(col: number, row: number): [number, number] {
    const { well, cell } = this.layout;
    return [well.x + col * cell, well.y + (row - HIDDEN) * cell];
  }

  handleEvents(events: readonly GameEvent[]): void {
    for (const e of events) {
      if (e.type === 'clear') this.onClear(e);
      else if (e.type === 'hardDrop') this.onHardDrop(e.rows);
      else if (e.type === 'lock') this.onLock(e.piece);
      else if (e.type === 'wipe') this.fx.banner('Fresh start');
      else if (e.type === 'levelUp') this.fx.banner(`Level ${e.level}`);
      else if (e.type === 'garbage') this.fx.pulse();
      else if (e.type === 'stash' && this.fx.profile.tweens) this.anim.startStash(e.id, this.lastPiece.x, this.lastPiece.y);
    }
  }

  private onHardDrop(rows: number): void {
    const k = feel.hardDropShake;
    if (rows > 0) this.fx.kick(Math.min(k.max, k.base + rows * k.perRow));
  }

  private onLock(piece: Piece): void {
    const { cell } = this.layout;
    for (const [cx, cy] of cellsOf(piece.id, piece.rot)) {
      const [x, y] = this.cellXY(piece.x + cx, piece.y + cy);
      this.fx.burst(x + cell / 2, y + cell, shapeIndex(piece.id), 1, cell * 2);
      if (piece.y + cy >= HIDDEN) this.fx.lockFlash(x, y, cell);
    }
  }

  private onClear(e: Extract<GameEvent, { type: 'clear' }>): void {
    const { cell } = this.layout;
    if (this.fx.profile.tweens && e.rows.length > 0) this.anim.startClear(e.rows, e.colors);
    this.fx.flashRows(e.rows.map((row) => this.cellXY(0, row)[1]), cell);
    e.rows.forEach((row, i) => {
      const [, y] = this.cellXY(0, row);
      (e.colors[i] as number[]).forEach((idx, col) => {
        const [x] = this.cellXY(col, row);
        this.fx.burst(x + cell / 2, y + cell / 2, idx, 5, cell * 7);
      });
    });
    if (e.label) this.fx.banner(e.label, [e.b2b ? 'Back-to-Back' : '', e.combo > 0 ? `Combo x${e.combo}` : '', e.allClear ? 'All clear!' : ''].filter(Boolean).join('  '));
    if (e.lines >= 4) this.fx.kick(feel.quadShake);
  }

  draw(s: GameState | null, dt: number, o: DrawOptions): void {
    const c = this.ctx;
    this.clock += dt;
    this.bg.update(dt, visualLevel(s));
    this.fx.update(o.paused ? 0 : dt, this.layout.cell);
    this.anim.update(o.paused ? 0 : dt);
    this.bg.draw(c, this.w, this.h);
    const { well, cell } = this.layout;
    this.bg.drawScenery(c, this.w, this.h, well, cell);
    const [sx, sy] = this.fx.shakeOffset();
    c.save();
    c.translate(sx, sy);
    this.bg.drawGlass(c, well, cell, this.dpr);
    if (s) this.drawPlay(s, o);
    this.fx.drawShards(c);
    this.fx.drawBanners(c, well.x + well.w / 2, well.y + well.h * 0.3, cell);
    c.restore();
    this.drawSide(s, o.paused);
  }

  private drawPlay(s: GameState, o: DrawOptions): void {
    const { well, cell } = this.layout;
    const pos = s.piece ? lerpPiece(o.prev, s.piece, s.piecesPlaced, o.alpha) : null;
    if (pos) this.lastPiece = { x: well.x + (pos.x + 1.5) * cell, y: well.y + (pos.y - HIDDEN + 1) * cell };
    const bo: BoardOpts = { ghost: o.ghost, paused: o.paused, assist: this.assist, dpr: this.dpr, tweens: this.fx.profile.tweens, time: this.clock, piecePos: pos };
    this.view.drawBoard(s, this.layout, this.anim, bo);
    if (!o.paused && s.status === 'playing') this.view.drawPiece(s, this.layout, bo);
    this.view.drawDanger(s, this.layout, bo);
    this.fx.drawFlashes(this.ctx, well.x, well.w);
    this.fx.drawPulse(this.ctx, well.x, well.y, well.w, well.h, cell);
    if (s.status === 'over') this.view.drawGameOver(s, this.layout);
  }

  private drawSide(s: GameState | null, paused: boolean): void {
    const c = this.ctx;
    const po = { dpr: this.dpr, assist: this.assist, paused };
    const tween = this.anim.stash();
    drawPanels(c, this.layout, s?.stash ?? null, s?.canStash ?? true, s ? s.bag.peek(5) : [], po, tween !== null);
    if (!tween) return;
    const to = stashSlot(this.layout);
    const { slot } = this.layout;
    const x = tween.fromX - slot.w / 2 + (to.x - (tween.fromX - slot.w / 2)) * tween.k;
    const y = tween.fromY - slot.h / 2 + (to.y - (tween.fromY - slot.h / 2)) * tween.k;
    drawMini(c, this.layout, tween.id, x, y, po, false);
  }
}

