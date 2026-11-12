// A running attempt: fixed-timestep stepping with previous/current state for interpolation.
import type { Controls } from './car';
import { CONFIG, STEP } from './config';
import type { Level } from './levels/types';
import type { SimEvent, SimState } from './sim';
import { createSim, stepSim } from './sim';

export class Session {
  level: Level;
  prev: SimState;
  curr: SimState;
  private acc = 0;

  constructor(level: Level) {
    this.level = level;
    this.curr = this.prev = createSim(level);
  }

  reset(level: Level = this.level): void {
    this.level = level;
    this.curr = this.prev = createSim(level);
    this.acc = 0;
  }

  /** Render blend factor between prev and curr. */
  get alpha(): number {
    return Math.min(1, this.acc / STEP);
  }

  get finished(): boolean {
    return this.curr.status !== 'ready' && this.curr.status !== 'playing';
  }

  /** Feed a real frame time; returns the events of every simulation step taken. */
  advance(frameMs: number, controls: Controls): SimEvent[] {
    const events: SimEvent[] = [];
    this.acc += Math.min(frameMs, CONFIG.sim.maxFrameMs) / 1000;
    let steps = 0;
    while (this.acc >= STEP && steps < CONFIG.sim.maxStepsPerFrame) {
      this.prev = this.curr;
      this.curr = stepSim(this.curr, controls, this.level, STEP);
      events.push(...this.curr.events);
      this.acc -= STEP;
      steps++;
      if (this.finished) {
        this.acc = 0;
        break;
      }
    }
    if (steps === CONFIG.sim.maxStepsPerFrame) this.acc = 0;
    return events;
  }
}
