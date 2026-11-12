// One run: the world, the player's sim, the input recorder and an optional ghost sim.
import { Recorder, Replayer } from './ghost';
import { hashSeed } from './rng';
import type { GhostRecord } from './scores';
import { newSim, scoreOf, stepSim, type SimState } from './sim';
import { World } from './world';

export class Run {
  readonly world: World;
  readonly sim: SimState = newSim();
  readonly recorder = new Recorder();
  readonly ghostSim: SimState | null;
  private readonly replayer: Replayer | null;

  constructor(readonly seedKey: string, ghost: GhostRecord | null) {
    this.world = new World(hashSeed(seedKey));
    this.ghostSim = ghost ? newSim() : null;
    this.replayer = ghost ? new Replayer(ghost.toggles) : null;
  }

  get score(): number { return scoreOf(this.sim); }

  /** Advance one fixed tick. Returns false once the player has crashed. */
  step(hold: boolean): boolean {
    const tick = this.sim.tick;
    this.recorder.record(tick, hold);
    if (this.ghostSim && this.replayer) stepSim(this.world, this.ghostSim, this.replayer.holdAt(tick));
    stepSim(this.world, this.sim, hold);
    return this.sim.alive;
  }

  record(): GhostRecord {
    return { seedKey: this.seedKey, score: this.score, toggles: [...this.recorder.toggles] };
  }
}
