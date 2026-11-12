// Procedural dino body-part geometry.  Bundle symbols: Bl PART_BUILDERS, Rl spike.
// Each builder returns a merged, vertex-coloured BufferGeometry in the bone's local space.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { bake, mergeAndShade, box, taperZ, taperY } from '../gfx/geometry.js';

const WHITE = 16777215;

/** Small 4-sided back spike. */
const spike = (x, y, z, s = 1) =>
  bake(new THREE.ConeGeometry(0.09 * s, 0.26 * s, 4), C.dinoDark, { pos: [x, y + 0.1 * s, z], rot: [0, Math.PI / 4, 0] });

const clawAt = (pos) => bake(new THREE.ConeGeometry(0.025, 0.1, 4), C.claw, { pos, rot: [-Math.PI / 2, 0, 0] });

function buildHead() {
  const parts = [
    bake(box(0.72, 0.6, 0.58), C.dinoBody, { pos: [0, 0.02, 0.28], warp: taperZ(1, 1, 0.88, 0.88) }),
    // snout
    bake(box(0.68, 0.36, 0.64), C.dinoBody, {
      pos: [0, 0.05, -0.27],
      warp: (v) => {
        if (v.z < 0) {
          v.x *= 0.7;
          if (v.y > 0) v.y *= 0.55;
        }
      },
    }),
    bake(box(0.46, 0.02, 0.56), C.mouth, { pos: [0, -0.135, -0.27], warp: taperZ(0.7, 1, 1, 1) }),
    // "locked in" headband + knot
    bake(box(0.76, 0.1, 0.6), C.band, { pos: [0, 0.27, 0.285], warp: taperZ(1, 1, 0.9, 1) }),
    bake(box(0.16, 0.13, 0.1), C.band, { pos: [0, 0.27, 0.6] }),
  ];
  for (const s of [-1, 1]) {
    parts.push(
      bake(new THREE.IcosahedronGeometry(0.12, 1), WHITE, { pos: [0.32 * s, 0.07, 0.1] }), // eye white (EYE)
      bake(box(0.08, 0.07, 0.36), C.dinoDark, { pos: [0.385 * s, 0.185, 0.1], rot: [-0.36, 0, 0] }), // brow
      bake(box(0.05, 0.04, 0.07), C.dinoDark, { pos: [0.1 * s, 0.155, -0.52] }), // nostril
      bake(box(0.05, 0.09, 0.05), WHITE, { pos: [0.09 * s, -0.165, -0.575] }), // front tooth
    );
    for (let i = 0; i < 4; i++) {
      parts.push(bake(box(0.04, 0.09, 0.05), WHITE, { pos: [(0.235 + 0.023 * i) * s, -0.165, -0.5 + i * 0.13] }));
    }
  }
  return mergeAndShade(parts);
}

function buildJaw() {
  const narrow = (v) => {
    if (v.z < 0) v.x *= 0.66;
  };
  const parts = [
    bake(box(0.6, 0.14, 0.86), C.dinoBody, { pos: [0, -0.07, -0.4], warp: narrow }),
    bake(box(0.44, 0.02, 0.7), C.mouth, { pos: [0, 0.004, -0.42], warp: narrow }),
  ];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      parts.push(bake(box(0.035, 0.07, 0.045), WHITE, { pos: [(0.2 + 0.028 * i) * s, 0.03, -0.72 + i * 0.15] }));
    }
  }
  return mergeAndShade(parts);
}

function buildFoot() {
  const parts = [bake(box(0.3, 0.16, 0.48), C.dinoDark, { pos: [0, 0, 0.135] })];
  for (const x of [-0.105, 0, 0.105]) {
    parts.push(
      bake(box(0.085, 0.11, 0.3), C.dinoDark, { pos: [x, -0.025, -0.22] }),
      bake(new THREE.ConeGeometry(0.04, 0.13, 4), C.claw, { pos: [x, -0.04, -0.41], rot: [-Math.PI / 2, 0, 0] }),
    );
  }
  return mergeAndShade(parts);
}

export const PART_BUILDERS = {
  torso: () =>
    mergeAndShade([
      bake(box(0.86, 0.92, 1.6, 1, 1, 2), C.dinoBody, { warp: taperZ(0.8, 0.85, 0.7, 0.7) }),
      bake(box(0.56, 0.16, 1.15, 1, 1, 2), C.dinoBelly, { pos: [0, -0.41, -0.1], warp: taperZ(0.85, 0.5, 0.75, 0.3) }),
      spike(0, 0.42, -0.42, 1),
      spike(0, 0.45, 0.05, 1.25),
      spike(0, 0.37, 0.5, 1.05),
    ]),
  neck: () =>
    mergeAndShade([
      bake(box(0.5, 0.52, 0.82, 1, 1, 2), C.dinoBody, { warp: taperZ(0.85, 0.85, 1, 1) }),
      bake(box(0.34, 0.1, 0.72), C.dinoBelly, { pos: [0, -0.23, 0] }),
      spike(0, 0.25, 0.1, 0.85),
    ]),
  head: buildHead,
  jaw: buildJaw,
  tail1: () => mergeAndShade([bake(box(0.6, 0.64, 0.86), C.dinoBody, { warp: taperZ(1, 1, 0.72, 0.72) }), spike(0, 0.27, -0.05, 0.95)]),
  tail2: () => mergeAndShade([bake(box(0.43, 0.46, 0.8), C.dinoBody, { warp: taperZ(1, 1, 0.62, 0.6) }), spike(0, 0.18, -0.08, 0.75)]),
  tail3: () => mergeAndShade([bake(box(0.27, 0.28, 0.8), C.dinoBody, { warp: taperZ(1, 1, 0.2, 0.2) })]),
  thigh: () =>
    mergeAndShade([
      bake(box(0.36, 0.9, 0.52, 1, 2, 1), C.dinoBody, {
        warp: (v) => {
          if (v.y < -0.01) {
            v.x *= 0.62;
            v.z *= 0.48;
          } else if (v.y > 0.01) {
            v.x *= 0.9;
            v.z *= 0.8;
          }
        },
      }),
    ]),
  shin: () => mergeAndShade([bake(box(0.2, 0.86, 0.24), C.dinoBody, { warp: taperY(1.05, 1.05, 0.75, 0.75) })]),
  foot: buildFoot,
  arm: () =>
    mergeAndShade([
      bake(box(0.12, 0.34, 0.13), C.dinoBody),
      bake(box(0.1, 0.1, 0.26), C.dinoBody, { pos: [0, -0.17, -0.1] }),
      clawAt([-0.028, -0.17, -0.27]),
      clawAt([0.028, -0.17, -0.27]),
    ]),
};
