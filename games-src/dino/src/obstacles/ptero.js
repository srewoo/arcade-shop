// Pterodactyl + tumbleweed geometry.  Bundle symbols: Yl buildPteroBody, Xl buildWing, Zl PTERO_COLLIDER, tu buildWeedGeometry.
import * as THREE from 'three';
import { PALETTE as C, WEED_RADIUS } from '../config.js';
import { damp, rand } from '../util.js';
import { bake, mergeAndShade, box, taperZ } from '../gfx/geometry.js';

const EYE_COLOR = 1776411;

/** Body, belly, tail, head, beak, crest, eyes.  The beak points toward +z (the player). */
export function buildPteroBody() {
  return mergeAndShade([
    bake(box(0.38, 0.34, 1.1, 1, 1, 2), C.ptero, { warp: taperZ(0.3, 0.35, 0.8, 0.85) }),
    bake(box(0.24, 0.06, 0.8), C.dinoBelly, { pos: [0, -0.15, 0.08] }),
    bake(box(0.1, 0.05, 0.42), C.ptero, { pos: [0, 0, -0.7], warp: taperZ(0.2, 1, 1, 1) }),
    bake(box(0.24, 0.26, 0.38), C.ptero, { pos: [0, 0.14, 0.68] }),
    bake(box(0.14, 0.12, 0.78), C.pteroBeak, { pos: [0, 0.1, 1.22], warp: taperZ(1, 1, 0.15, 0.2) }),
    bake(box(0.06, 0.22, 0.52), C.pteroCrest, { pos: [0, 0.3, 0.48], warp: taperZ(1, 0.15, 1, 1) }),
    bake(box(0.03, 0.06, 0.06), EYE_COLOR, { pos: [-0.125, 0.2, 0.76] }),
    bake(box(0.03, 0.06, 0.06), EYE_COLOR, { pos: [0.125, 0.2, 0.76] }),
  ]);
}

/** One wing segment for `side` (-1/+1); `outer` = the swept-back tip segment. */
export function buildWing(side, outer) {
  const length = outer ? 0.9 : 0.95;
  return mergeAndShade([
    bake(box(length, outer ? 0.035 : 0.05, outer ? 0.5 : 0.62), C.pteroWing, {
      warp: (v) => {
        if (v.x * side > 0) v.z = outer ? v.z * 0.08 - 0.2 : v.z * 0.8 - 0.06;
      },
      pos: [(side * length) / 2, 0, 0],
    }),
  ]);
}

/** Ragdoll colliders for a knocked-out pterodactyl (body box + wing span box). */
export const PTERO_COLLIDER = [
  { box: [0.2, 0.18, 0.75], at: [0, 0, 0.2] },
  { box: [1.5, 0.04, 0.28], at: [0, 0, 0] },
];

/** Tumbleweed: core icosphere plus six randomly-oriented torus "twigs". */
export function buildWeedGeometry() {
  const parts = [bake(new THREE.IcosahedronGeometry(0.34, 1), 11111253)];
  for (let i = 0; i < 6; i++) {
    parts.push(
      bake(new THREE.TorusGeometry(WEED_RADIUS * rand(0.78, 0.96), 0.022, 4, 9), i % 2 ? C.weed : 10517829, {
        rot: [rand(0, 3.14), rand(0, 3.14), rand(0, 3.14)],
      }),
    );
  }
  return mergeAndShade(parts);
}

/** Flap (or, for a knocked-out ptero, droop) the wings of an obstacle record. */
export function flapWings(o, dt, limp) {
  o.flap += dt * (limp ? 3 : 8.5);
  for (const w of o.wings) {
    if (limp) {
      w.inner.rotation.z = damp(w.inner.rotation.z, w.side * (-0.35 + 0.12 * Math.sin(o.flap)), 6, dt);
      w.outer.rotation.z = damp(w.outer.rotation.z, w.side * -0.7, 6, dt);
    } else {
      w.inner.rotation.z = w.side * (0.12 + 0.5 * Math.sin(o.flap));
      w.outer.rotation.z = w.side * (0.1 + 0.6 * Math.sin(o.flap - 0.9));
    }
  }
}
