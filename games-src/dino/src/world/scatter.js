// Instanced scenery that endlessly recycles along z (bundle class `hu`).  One InstancedMesh per prop type;
// instances that fall behind the camera are re-placed `span` units further ahead.
import * as THREE from 'three';
import { rand } from '../util.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

const BEHIND = 30; // recycle once this far behind the player

export class Scatter {
  /**
   * @param opts span (z length of the strip), x:[min,max] lateral distance, bias (power on the random lateral
   *   offset; >1 hugs the track), scale:[min,max], yScale, sink, tilt, tint, clear/reach (keep clear of the track),
   *   wide (random extra x stretch), castShadow
   */
  constructor(scene, geometry, material, count, opts) {
    this.opts = { bias: 1, sink: 0, yScale: [1, 1], tilt: 0, tint: 0, clear: 0, reach: 1, ...opts };
    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = !!opts.castShadow;
    this.mesh.receiveShadow = false;
    this.z = new Float32Array(count); // current z of each instance
    scene.add(this.mesh);
  }

  _place(index, z) {
    const o = this.opts;
    this.z[index] = z;
    const side = Math.random() < 0.5 ? -1 : 1;
    const base = rand(o.scale[0], o.scale[1]);
    const sx = base * (o.wide ? rand(0.8, 1.5) : 1);
    const sy = base * rand(o.yScale[0], o.yScale[1]);
    let x = o.x[0] + (o.x[1] - o.x[0]) * Math.random() ** +o.bias;
    if (o.clear) x = Math.max(x, Math.max(sx, base) * o.reach + o.clear);
    _m.compose(
      _p.set(side * x, -o.sink * sy, z),
      _q.setFromEuler(_e.set(rand(-o.tilt, o.tilt), rand(0, Math.PI * 2), rand(-o.tilt, o.tilt))),
      _s.set(sx, sy, base),
    );
    this.mesh.setMatrixAt(index, _m);
    if (o.tint) {
      const k = 1 + rand(-o.tint, o.tint);
      this.mesh.setColorAt(index, _c.setRGB(k, k, k));
    }
  }

  _flush() {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /** Re-scatter the whole strip around playerZ. */
  reset(playerZ) {
    const n = this.mesh.count;
    for (let i = 0; i < n; i++) this._place(i, playerZ + BEHIND - ((i + Math.random()) / n) * this.opts.span);
    this._flush();
  }

  update(playerZ) {
    let dirty = false;
    for (let i = 0; i < this.mesh.count; i++) {
      if (this.z[i] > playerZ + BEHIND) {
        this._place(i, this.z[i] - this.opts.span);
        dirty = true;
      }
    }
    if (dirty) this._flush();
  }
}
