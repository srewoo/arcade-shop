// Orchestrates the environment particles for the selected weather (snow flakes, rain + lightning) and keeps
// their budget in line with graphics quality, device and reduced motion.  Palettes live in biomes.js.
import { SnowFall, snowUniforms } from './snow.js';
import { Rain } from './rain.js';
import { particleBudget } from './weatherModes.js';

export class Weather {
  constructor(scene) {
    this.snow = new SnowFall(scene);
    this.rain = new Rain(scene);
    this.id = 'auto';
    this.speed = 1; // particle speed scale (reduced motion slows them)
    this.worldSpeed = 0; // set by the run: how fast the world slides past the camera
    this.time = 0;
  }

  /** Apply the weather id with the current quality / device / reduced-motion state. */
  configure(id, quality, { reduced, mobile }) {
    this.id = id;
    const b = particleBudget(id, quality, { reduced, mobile });
    this.speed = b.speed;
    this.snow.setBudget(id === 'snow' ? b.count : 0);
    this.rain.setBudget(id === 'rain' ? b.count : 0, b.lightning);
  }

  get flash() {
    return this.rain.flash;
  }

  update(dt, camera) {
    this.time += dt;
    snowUniforms.uUpView.value.set(0, 1, 0).transformDirection(camera.matrixWorldInverse);
    const ctx = { speed: this.speed, worldSpeed: this.worldSpeed * this.speed, time: this.time };
    if (this.id === 'snow') this.snow.update(dt, camera, ctx);
    else if (this.id === 'rain') this.rain.update(dt, camera, ctx);
  }
}
