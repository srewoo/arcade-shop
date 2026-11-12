// Title-screen demo: a real sim played by the greedy bot, restarted when it ends. Rendered behind
// the title dialog; its sounds are not played.
import { CONFIG } from './config';
import { bestMove } from './model/bot';
import { Sim } from './model/sim';
import type { SimEvent } from './model/types';
import { createRng } from './rng';

export class Attract {
  sim: Sim;
  private zapTimer = 0;
  private restartTimer = 0;
  private seedN: number;

  constructor(seed: () => number) {
    this.seedN = seed();
    this.sim = this.make();
  }

  private make(): Sim {
    this.seedN = (this.seedN + 0x9e3779b9) >>> 0;
    return new Sim({ level: 3, rng: createRng(this.seedN), timed: false });
  }

  /** Advance one fixed step; returns the events (for visual effects only). */
  step(dt: number): SimEvent[] {
    if (this.sim.status !== 'playing') {
      this.restartTimer += dt;
      if (this.restartTimer >= CONFIG.flow.attractRestartSec) {
        this.restartTimer = 0;
        this.sim = this.make();
      }
      return this.sim.drain();
    }
    this.sim.step(dt);
    this.zapTimer += dt;
    if (this.zapTimer >= CONFIG.flow.attractZapSec && !this.sim.busy) {
      this.zapTimer = 0;
      const m = bestMove(this.sim);
      if (m) this.sim.zap(m.col, m.row);
    }
    return this.sim.drain();
  }
}
