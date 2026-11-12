// The feeder: builds a row of new discs along the top one at a time (each with a rising tone),
// then drops them in random order. Each completed row builds faster than the last.
import { CONFIG } from '../config';
import { release } from './fall';
import { feederKind } from './rules';
import type { LevelParams, Tile } from './types';
import { makeTile, removeFrom, type World } from './world';

export class Spawner {
  readonly queued: Tile[] = [];
  /** Fresh tiles currently falling. */
  readonly flying: Tile[] = [];
  private phase: 'build' | 'drop' = 'build';
  private timer = 0;
  private interval: number;

  constructor(private readonly params: LevelParams) {
    this.interval = params.spawnInterval;
  }

  get buildInterval(): number { return this.interval; }

  /** `hold` pauses the drop phase (while the base row slides). */
  step(w: World, dt: number, hold: boolean): void {
    for (const t of this.queued) { t.px = t.x; t.age += dt; }
    for (const t of this.flying) t.age += dt;
    if (this.phase === 'build') this.build(w, dt);
    else this.drop(w, dt, hold);
  }

  private build(w: World, dt: number): void {
    this.timer += dt;
    if (this.timer < this.interval || this.flying.length > 0) return;
    this.timer = 0;
    const col = this.queued.length;
    const t = makeTile(w, feederKind(w.rng, this.params), col, CONFIG.grid.spawnRow);
    t.state = 'queued';
    t.fresh = true;
    this.queued.push(t);
    w.all.push(t);
    w.events.push({ t: 'spawn', col });
    if (this.queued.length >= CONFIG.grid.cols) {
      this.interval = Math.max(CONFIG.level.minRowInterval, this.interval * CONFIG.level.rowSpeedup);
      this.phase = 'drop';
      this.timer = 0;
    }
  }

  private drop(w: World, dt: number, hold: boolean): void {
    if (hold) return;
    this.timer += dt;
    if (this.timer < CONFIG.feeder.dropEverySec) return;
    this.timer = 0;
    const t = this.queued[w.rng.int(0, this.queued.length - 1)];
    if (!t) { this.phase = 'build'; return; }
    removeFrom(this.queued, t);
    release(t, CONFIG.fall.fresh);
    this.flying.push(t);
    if (this.queued.length === 0) this.phase = 'build';
  }
}
