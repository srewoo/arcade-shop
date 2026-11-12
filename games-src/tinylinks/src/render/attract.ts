// Title-screen demo: a ball rolls across "Pond Bridge" into the cup, over and over.
import { ALL_HOLES } from '../course';
import { CONFIG } from '../config';
import { FixedStepper } from '../loop';
import { solveHole, type BotShot } from '../physics/solver';
import { Sim } from '../physics/sim';
import type { FxEvent } from '../game/game';
import type { Scene } from './frame';

export class Attract {
  private readonly hole = ALL_HOLES[6] ?? (ALL_HOLES[0] as (typeof ALL_HOLES)[number]);
  private readonly shot: BotShot | null = solveHole(this.hole)?.shots[0] ?? null;
  private sim = new Sim(this.hole);
  private wait = 1.2;
  private readonly stepper = new FixedStepper(CONFIG.sim.dt, CONFIG.sim.maxFrameSec, CONFIG.sim.maxStepsPerFrame);

  constructor(private readonly onFx: (e: FxEvent) => void) {}

  update(dt: number): void {
    const sim = this.sim;
    this.stepper.advance(dt, () => { sim.step(); for (const e of sim.events.splice(0)) this.onFx(e); });
    this.wait -= dt;
    if (this.wait > 0) return;
    if (sim.state === 'idle' && sim.ball.x === this.hole.tee.x && this.shot) { sim.strike(this.shot.angle, this.shot.power); this.wait = 1.5; return; }
    if (sim.state !== 'rolling') { this.sim = new Sim(this.hole, sim.tick); this.wait = 1.4; }
  }

  scene(): Scene {
    return { hole: this.hole, sim: this.sim, alpha: this.stepper.alpha, color: 'tomato', seat: 0, label: '', sinkT: this.sim.state === 'sunk' ? 1 : 0, aim: null };
  }
}
