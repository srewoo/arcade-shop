// Camera-following particle volume shared by snow and rain.  One preallocated buffer, a draw range for the live
// count, positions stored relative to the camera and wrapped inside a box: no per-frame allocation.
import * as THREE from 'three';

const BOX = { x: 20, yMin: -5, yMax: 20, zNear: 10, zFar: -75 };

export class ParticleCloud {
  /** @param lines false = point sprites, true = streak segments (2 vertices each) */
  constructor(scene, material, max, lines) {
    this.max = max;
    this.lines = lines;
    this.count = 0;
    this.verts = lines ? 2 : 1;
    this.pos = new Float32Array(max * this.verts * 3);
    this.px = new Float32Array(max);
    this.py = new Float32Array(max);
    this.pz = new Float32Array(max);
    this.fall = new Float32Array(max); // fall speed multiplier per particle
    this.phase = new Float32Array(max);
    for (let i = 0; i < max; i++) this._respawn(i, true);
    const geo = new THREE.BufferGeometry();
    this.attr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.attr);
    geo.setDrawRange(0, 0);
    this.object = lines ? new THREE.LineSegments(geo, material) : new THREE.Points(geo, material);
    this.object.frustumCulled = false;
    this.object.visible = false;
    this.object.renderOrder = 5;
    scene.add(this.object);
  }

  _respawn(i, anywhere) {
    this.px[i] = (Math.random() * 2 - 1) * BOX.x;
    this.py[i] = anywhere ? BOX.yMin + Math.random() * (BOX.yMax - BOX.yMin) : BOX.yMax;
    this.pz[i] = BOX.zFar + Math.random() * (BOX.zNear - BOX.zFar);
    this.fall[i] = 0.7 + Math.random() * 0.6;
    this.phase[i] = Math.random() * 6.28;
  }

  setCount(n) {
    this.count = Math.min(this.max, Math.max(0, n));
    this.object.geometry.setDrawRange(0, this.count * this.verts);
    this.object.visible = this.count > 0;
  }

  /**
   * @param fallSpeed units/s, @param sway lateral drift amplitude, @param worldSpeed player speed (the world slides
   * toward the camera), @param streak streak length per unit of fall speed (lines only)
   */
  step(dt, camera, { fallSpeed, sway = 0, worldSpeed = 0, streak = 0, time = 0 }) {
    if (!this.count) return;
    this.object.position.copy(camera.position);
    const pos = this.pos, v = this.verts;
    for (let i = 0; i < this.count; i++) {
      const fs = fallSpeed * this.fall[i];
      this.py[i] -= fs * dt;
      this.pz[i] += worldSpeed * dt;
      this.px[i] += Math.sin(time * 1.3 + this.phase[i]) * sway * dt;
      if (this.py[i] < BOX.yMin) this._respawn(i, false);
      else if (this.pz[i] > BOX.zNear) this.pz[i] -= BOX.zNear - BOX.zFar;
      const o = i * v * 3;
      pos[o] = this.px[i];
      pos[o + 1] = this.py[i];
      pos[o + 2] = this.pz[i];
      if (this.lines) {
        pos[o + 3] = this.px[i];
        pos[o + 4] = this.py[i] + fs * streak;
        pos[o + 5] = this.pz[i] - worldSpeed * streak; // tilt back with the relative wind
      }
    }
    this.attr.needsUpdate = true;
  }
}
