// Pooled dust puffs rendered as one InstancedMesh of tiny icosahedra (bundle class `Hm`).
import * as THREE from 'three';
import { rand } from '../util.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export class DustPuffs {
  constructor(scene, capacity = 64) {
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({ color: 16768170, transparent: true, opacity: 0.5, depthWrite: false });
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.frustumCulled = false;
    this.items = Array.from({ length: capacity }, () => ({
      life: 0, max: 1, size: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), spin: 0,
    }));
    this.cursor = 0; // ring-buffer write head
    this.scale = 1; // particle-count factor (reduced motion sets 0.4; 1 keeps the original counts and random draws)
    scene.add(this.mesh);
    this.clear();
  }

  clear() {
    _m.makeScale(0, 0, 0);
    this.items.forEach((it, i) => {
      it.life = 0;
      this.mesh.setMatrixAt(i, _m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Emit `count` puffs near `origin`.  strength scales size/speed/life; `backward` adds z velocity (0.25x).
   */
  puff(origin, count = 3, strength = 1, backward = 0) {
    const n = this.scale === 1 ? count : Math.max(1, Math.round(count * this.scale));
    for (let i = 0; i < n; i++) {
      const it = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % this.items.length;
      it.max = it.life = rand(0.35, 0.75) * (0.7 + 0.5 * strength);
      it.size = rand(0.1, 0.2) * (0.6 + strength);
      it.pos.set(origin.x + rand(-0.25, 0.25), Math.max(0.05, origin.y * 0.3) + rand(0, 0.15), origin.z + rand(-0.25, 0.25));
      it.vel.set(rand(-1.6, 1.6) * strength, rand(0.6, 2.4) * strength, backward * 0.25 + rand(-1.2, 1.2) * strength);
      it.spin = rand(0, 6.28);
    }
  }

  /** Radial ring of `count` puffs around `origin` in the x/y plane (pickup burst); keeps the real height. */
  ring(origin, count = 12, strength = 1) {
    for (let i = 0; i < count; i++) {
      const it = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % this.items.length;
      const a = (i / count) * Math.PI * 2;
      it.max = it.life = 0.5 * (0.8 + 0.3 * strength);
      it.size = 0.16 * (0.8 + strength * 0.4);
      it.pos.set(origin.x, origin.y, origin.z);
      it.vel.set(Math.cos(a) * 3.2 * strength, Math.sin(a) * 3.2 * strength, 0);
      it.spin = a;
    }
  }

  update(dt) {
    let dirty = false;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      if (it.life <= 0) continue;
      dirty = true;
      it.life -= dt;
      const age = 1 - Math.max(0, it.life) / it.max; // 0 -> 1
      it.vel.multiplyScalar(Math.exp(-2.4 * dt)); // drag
      it.vel.y -= 1.2 * dt; // light gravity
      it.pos.addScaledVector(it.vel, dt);
      // pop in over the first 18% of life, then shrink with a 1.6 power curve
      const scale = it.life <= 0 ? 0 : (age < 0.18 ? 0.35 + (0.65 * age) / 0.18 : 1 - ((age - 0.18) / 0.82) ** 1.6) * it.size;
      _m.compose(_p.copy(it.pos), _q.setFromAxisAngle(_s.set(0.3, 0.9, 0.2).normalize(), it.spin + age * 2), _s.set(scale, scale, scale));
      this.mesh.setMatrixAt(i, _m);
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
