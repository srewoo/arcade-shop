// Dino face animation: jaw, pupils and the headband tails (split out of rig.js).  Works on a DinoRig instance.
import * as THREE from 'three';
import { clamp, damp, lerp } from '../util.js';
import { EYE } from './skeleton.js';

const _pos = new THREE.Vector3();

/** @param rig DinoRig, @param blend {r, a, d, ph} run / air / duck blends and run phase (only outside ragdoll mode) */
export function animateFace(rig, dt, blend) {
  const t = rig.time;
  const kick = rig.jawKick.update(dt);
  if (rig.ragdoll) {
    rig.time += dt;
    rig.jaw.rotation.x = -clamp(0.45 + kick * 0.25, 0.02, 1);
    for (const p of rig.pupils) {
      p.spin = damp(p.spin, 2.5 * Math.sign(p.spin || 1), 1.6, dt);
      p.ang += p.spin * dt;
      _pos.set(p.side * 0.85, Math.sin(p.ang) * 0.62, Math.cos(p.ang) * 0.62).normalize().multiplyScalar(0.085);
      p.mesh.position.set(EYE.x * p.side + _pos.x, EYE.y + _pos.y, EYE.z + _pos.z);
    }
    rig.bandTails.forEach((m, i) => m.rotation.set(0.5 + 0.5 * Math.sin(t * 9 + i * 2), 0.5 * Math.sin(t * 7 + i), 0));
    return;
  }
  const { r: run, a: air, d: duck, ph } = blend;
  const open = 0.05 + run * 0.1 * Math.max(0, Math.sin(2 * ph + 0.5)) + air * 0.55 + duck * 0.12;
  rig.jaw.rotation.x = -clamp(open + kick * 0.05, 0.02, 1);
  for (const p of rig.pupils) {
    _pos
      .set(p.side * 0.6, 0.06 + 0.05 * run * Math.sin(2 * ph), -0.8 + 0.3 * (1 - run) * Math.sin(t * 0.55))
      .normalize()
      .multiplyScalar(0.085);
    p.mesh.position.set(EYE.x * p.side + _pos.x, EYE.y + _pos.y, EYE.z + _pos.z);
  }
  rig.bandTails.forEach((m, i) => {
    const streak = run * (1 - 0.3 * air);
    m.rotation.set(lerp(1.25 + 0.05 * Math.sin(t * 2 + i), -0.12 + 0.2 * Math.sin(t * 17 + i * 1.7), streak), streak * 0.32 * Math.sin(t * 13 + i * 2.1), 0);
  });
}
