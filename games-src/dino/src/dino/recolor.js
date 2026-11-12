// Dino colour skins: remaps the three body tones in the shared dino geometries.  Original vertex colours are
// cached on first use so any skin (or the original) can be applied repeatedly.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';

const EPS = 2e-3;
const _from = ['dinoBody', 'dinoDark', 'dinoBelly'].map((k) => new THREE.Color(C[k]));
const _to = _from.map((c) => c.clone());

function geometriesOf(rig) {
  const set = new Set();
  rig.rig.traverse((o) => o.isMesh && set.add(o.geometry));
  for (const p of rig.list) set.add(p.mesh.geometry);
  return set;
}

/** @param colors {body, dark, belly} 0xRRGGBB, or null for the original palette */
export function applySkinColors(rig, colors) {
  const targets = colors ? [colors.body, colors.dark, colors.belly] : null;
  for (let i = 0; i < 3; i++) _to[i].set(targets ? targets[i] : _from[i]);
  for (const geo of geometriesOf(rig)) {
    const attr = geo.getAttribute('color');
    if (!attr) continue;
    const orig = (geo.userData.origColors ??= Float32Array.from(attr.array));
    for (let v = 0; v < attr.count; v++) {
      const r = orig[v * 3], g = orig[v * 3 + 1], b = orig[v * 3 + 2];
      let out = null;
      for (let i = 0; i < 3 && !out; i++) {
        const f = _from[i];
        if (Math.abs(r - f.r) < EPS && Math.abs(g - f.g) < EPS && Math.abs(b - f.b) < EPS) out = _to[i];
      }
      attr.setXYZ(v, out ? out.r : r, out ? out.g : g, out ? out.b : b);
    }
    attr.needsUpdate = true;
  }
}
