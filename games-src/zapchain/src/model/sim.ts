// One level of play: the grid, the feeder, gravity, zaps and the clock. Pure and deterministic
// for a given RNG; the renderer only reads it.
import { CONFIG } from '../config';
import type { Rng } from '../rng';
import { release, startSlides, stepFall, stepSlide } from './fall';
import { emptyCells, findGroup, releaseFloating } from './grid';
import { levelParams, openingHeights, randomColour, zapPoints } from './rules';
import { Spawner } from './spawner';
import { BOMB, type CellRef, type LevelParams, type OverReason, type SimEvent, type Tile, type ZapInfo } from './types';
import { makeTile, removeFrom, type World } from './world';

export type SimStatus = 'playing' | 'cleared' | 'over';
export interface SimOptions { level: number; rng: Rng; startScore?: number; timed?: boolean; params?: Partial<LevelParams> }

export class Sim {
  readonly params: LevelParams;
  readonly w: World;
  readonly spawner: Spawner;
  status: SimStatus = 'playing';
  overReason: OverReason | null = null;
  score: number;
  cleared = 0;
  elapsed = 0;
  private readonly dropping: Tile[] = [];
  private readonly sliding: Tile[] = [];
  private compactPending = false;
  private warned = false;
  private readonly timed: boolean;

  constructor(o: SimOptions) {
    this.params = { ...levelParams(o.level), ...o.params };
    this.score = o.startScore ?? 0;
    this.timed = o.timed ?? true;
    this.w = { cells: emptyCells(), all: [], events: [], rng: o.rng, nextId: 1, version: 0 };
    this.spawner = new Spawner(this.params);
    this.fillOpening();
  }

  get cells(): World['cells'] { return this.w.cells; }
  get tiles(): readonly Tile[] { return this.w.all; }
  get version(): number { return this.w.version; }
  get remaining(): number { return Math.max(0, this.params.seconds - this.elapsed); }
  get toGo(): number { return Math.max(0, this.params.target - this.cleared); }
  /** Zaps are refused while discs from the last zap are still falling or sliding. */
  get busy(): boolean { return this.dropping.length > 0 || this.sliding.length > 0; }

  drain(): SimEvent[] { return this.w.events.splice(0); }

  private fillOpening(): void {
    const heights = openingHeights(this.w.rng, this.params);
    heights.forEach((h, c) => {
      for (let i = 0; i < h; i++) {
        const row = CONFIG.grid.floorRow - i;
        const t = makeTile(this.w, randomColour(this.w.rng, this.params), c, row);
        this.w.cells[row]![c] = t;
        this.w.all.push(t);
      }
    });
  }

  /** Try to zap the disc at (col,row). Returns true when something was zapped. */
  zap(col: number, row: number): boolean {
    if (this.status !== 'playing' || this.busy) return false;
    const t = this.w.cells[row]?.[col];
    if (!t) return false;
    if (t.kind === BOMB) return this.zapBomb(col, row);
    const group = findGroup(this.w.cells, col, row);
    if (group.length < 2) {
      this.w.events.push({ t: 'invalid', col, row });
      return false;
    }
    const cells = group.map((g): ZapInfo => ({ col: g.col, row: g.row, kind: t.kind, depth: g.depth, parent: g.parent }));
    const points = this.removeCells(cells);
    this.w.events.push({ t: 'zap', kind: t.kind, n: cells.length, points, cells });
    this.afterZap();
    return true;
  }

  private zapBomb(col: number, row: number): boolean {
    const cells: ZapInfo[] = [];
    for (let c = 0; c < CONFIG.grid.cols; c++) {
      const t = this.w.cells[row]?.[c];
      if (t) cells.push({ col: c, row, kind: t.kind, depth: Math.abs(c - col), parent: -1 });
    }
    const points = this.removeCells(cells);
    this.w.events.push({ t: 'bomb', col, row, n: cells.length, points, cells });
    this.afterZap();
    return true;
  }

  private removeCells(cells: readonly CellRef[]): number {
    for (const { col, row } of cells) {
      const t = this.w.cells[row]?.[col];
      if (!t) continue;
      this.w.cells[row]![col] = null;
      removeFrom(this.w.all, t);
    }
    for (const t of releaseFloating(this.w.cells)) {
      release(t, CONFIG.fall.zap);
      t.hold = CONFIG.fall.zapHold;
      this.dropping.push(t);
    }
    this.w.version++;
    const points = zapPoints(cells.length);
    this.score += points;
    this.cleared += cells.length;
    return points;
  }

  private afterZap(): void {
    this.compactPending = true;
    if (!this.w.all.some((t) => !t.fresh)) {
      this.score += CONFIG.score.clearBonus;
      this.w.events.push({ t: 'wipe', bonus: CONFIG.score.clearBonus });
    }
    if (this.cleared >= this.params.target) {
      this.status = 'cleared';
      this.w.events.push({ t: 'cleared' });
    }
  }

  private finish(reason: OverReason): void {
    this.status = 'over';
    this.overReason = reason;
    this.w.events.push({ t: 'over', reason });
  }

  /** Advance one fixed step. */
  step(dt: number): void {
    if (this.status !== 'playing') return;
    this.stepTiles(dt);
    if (this.status !== 'playing') return;
    this.maybeCompact();
    if (!this.timed) return;
    this.elapsed += dt;
    if (!this.warned && this.remaining <= CONFIG.level.warnSeconds) {
      this.warned = true;
      this.w.events.push({ t: 'warn' });
    }
    if (this.elapsed > this.params.seconds) this.finish('time');
  }

  private stepTiles(dt: number): void {
    if (this.sliding.length > 0) stepSlide(this.sliding, dt);
    for (const t of this.w.all) if (t.squash > 0) t.squash = Math.max(0, t.squash - dt);
    if (this.dropping.length > 0) stepFall(this.w, this.dropping, CONFIG.fall.zap, dt);
    this.spawner.step(this.w, dt, this.sliding.length > 0);
    const res = stepFall(this.w, this.spawner.flying, CONFIG.fall.fresh, dt);
    if (res.overflow) { this.finish('full'); return; }
    if (res.landed.some((t) => t.row === CONFIG.grid.floorRow)) this.compactPending = true;
  }

  private maybeCompact(): void {
    if (!this.compactPending || this.dropping.length > 0 || this.sliding.length > 0) return;
    this.compactPending = false;
    this.sliding.push(...startSlides(this.w));
  }
}
