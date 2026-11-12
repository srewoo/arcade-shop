// Rain environment: streaking rain particles, occasional lightning (a light/sky flash) and delayed thunder.
import * as THREE from 'three';
import { ParticleCloud } from './particles.js';
import { lightningIntensity, nextLightningDelay, thunderDelay } from './weatherModes.js';

const MAX_DROPS = 1600;

export class Rain {
  constructor(scene) {
    const mat = new THREE.LineBasicMaterial({ color: 0xc4d0e0, transparent: true, opacity: 0.5, depthWrite: false });
    this.cloud = new ParticleCloud(scene, mat, MAX_DROPS, true);
    this.lightning = false;
    this.timer = nextLightningDelay(Math.random());
    this.flashT = -1;
    this.thunderIn = -1;
    this.flash = 0; // 0..1 current flash brightness (read by the day/night rig)
    this.onThunder = null; // () => void
  }

  setBudget(count, lightning) {
    this.cloud.setCount(count);
    this.lightning = lightning;
    if (!lightning) this.flashT = this.thunderIn = -1;
  }

  /** Thunder still rumbles (rarely) with reduced motion, but nothing flashes. */
  _strike(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = nextLightningDelay(Math.random());
    if (this.lightning) this.flashT = 0;
    this.thunderIn = thunderDelay(Math.random());
  }

  update(dt, camera, { speed, worldSpeed, time }) {
    if (!this.cloud.count) {
      this.flash = 0;
      return;
    }
    this.cloud.step(dt, camera, { fallSpeed: 24 * speed, worldSpeed, streak: 0.028, sway: 0, time });
    this._strike(dt);
    if (this.flashT >= 0) {
      this.flashT += dt;
      this.flash = lightningIntensity(this.flashT);
      if (this.flashT > 0.6) this.flashT = -1;
    } else this.flash = 0;
    if (this.thunderIn >= 0 && (this.thunderIn -= dt) < 0) this.onThunder?.();
  }
}
