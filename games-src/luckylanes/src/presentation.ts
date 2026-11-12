// Render-side state of the game: camera, canvas size, particles, juice and the drag trail.
// None of it feeds the physics.
import type { AudioEngine } from './audio';
import type { Point } from './drag';
import { createJuice, decayJuice, type FxContext } from './juice';
import { createParticles, updateParticles } from './particles';
import { createCamera, type Camera } from './project';
import type { Rng } from './rng';
import { TUNING } from './tuning';

export class Presentation {
  size = { w: 400, h: 600 };
  cam: Camera = createCamera(400, 600);
  readonly particles = createParticles();
  readonly juice = createJuice();
  reduced = false;
  /** Colour-blind assist: high-contrast guide. */
  highContrast = false;
  time = 0;
  /** Live drag path (screen px) for the throw trail. */
  dragTrail: readonly Point[] = [];

  get shake(): number {
    return this.juice.shake;
  }

  /** Resize the canvas model; the camera keeps its x and y. */
  resize(w: number, h: number): void {
    const { x, y } = this.cam;
    this.size = { w, h };
    this.cam = createCamera(w, h);
    this.cam.x = x;
    this.cam.y = y;
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on;
    this.particles.intensity = on ? TUNING.juice.reducedIntensity : 1;
  }

  update(dt: number): void {
    this.time += dt;
    updateParticles(this.particles, dt);
    decayJuice(this.juice, dt);
  }

  fx(audio: AudioEngine, rng: Rng): FxContext {
    return { particles: this.particles, rng, cam: this.cam, audio, reduced: this.reduced };
  }
}
