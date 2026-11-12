// The rolling phase: fixed-step physics driven by a time accumulator, plus the render
// interpolation state and the effects that physics events trigger.
import type { AudioEngine } from './audio';
import { DT, MAX_SPEED } from './constants';
import { capture, createSnapshot, interpolate, type RenderView } from './interp';
import { onImpact, type FxContext, type Juice } from './juice';
import { drainEvents, stepWorld } from './physics';
import { clamp } from './rng';
import type { World } from './worldTypes';

export class Rolling {
  acc = 0;
  /** Interpolation factor 0..1 between the previous and current physics step. */
  alpha = 1;
  private readonly prev = createSnapshot();

  begin(world: World): void {
    this.acc = 0;
    this.alpha = 1;
    capture(this.prev, world);
  }

  view(world: World): RenderView {
    return interpolate(this.prev, world, this.alpha);
  }

  /** Advance the simulation by `dt` seconds of wall time. Hit-stop freezes stepping but not the render. */
  advance(world: World, dt: number, juice: Juice, fx: FxContext, audio: AudioEngine): void {
    if (juice.hitStop > 0) juice.hitStop -= dt;
    else this.acc += Math.min(dt, 0.1);
    while (this.acc >= DT && !world.done) {
      this.acc -= DT;
      capture(this.prev, world);
      stepWorld(world);
      this.dispatch(world, juice, fx, audio);
      if (juice.hitStop > 0) break;
    }
    this.alpha = world.done ? 1 : clamp(this.acc / DT, 0, 1);
    const b = world.ball;
    audio.updateRoll(b.active ? clamp(Math.hypot(b.vx, b.vy) / MAX_SPEED, 0, 1) : 0, b.inGutter);
  }

  private dispatch(world: World, juice: Juice, fx: FxContext, audio: AudioEngine): void {
    for (const e of drainEvents(world)) {
      if (e.kind === 'ballPin' || e.kind === 'pinPin') onImpact(juice, fx, e);
      else if (e.kind === 'gutter') audio.clatter(120);
      else if (e.kind === 'pit') audio.clatter(300);
    }
  }
}
