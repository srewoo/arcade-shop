// "Trauma" camera shake (bundle class `Um`): shake amplitude = trauma^2, trauma decays at 1.7/s.
import * as THREE from 'three';

export class CameraShake {
  constructor() {
    this.trauma = 0;
    this.scale = 1; // 0 disables shake (settings: camera shake off / reduced motion)
    this.t = 0;
    this.offset = new THREE.Vector3();
    this.roll = 0;
  }
  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount * this.scale);
  }
  update(dt) {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    const k = this.trauma * this.trauma;
    const t = this.t;
    // sums of incommensurate sines stand in for noise
    this.offset.set(
      (Math.sin(t * 71) + Math.sin(t * 113 + 1.3)) * 0.5 * k * 0.42,
      (Math.sin(t * 89 + 2.1) + Math.sin(t * 127 + 0.4)) * 0.5 * k * 0.36,
      0,
    );
    this.roll = Math.sin(t * 97 + 0.7) * k * 0.045;
  }
}
