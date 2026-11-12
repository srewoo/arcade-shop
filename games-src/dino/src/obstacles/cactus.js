// Cactus variants.  Bundle symbols: Kl CACTUS_SPECS, ql buildCactusGeometry, Jl cactusCollisionBoxes.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { bake, mergeAndShade } from '../gfx/geometry.js';

/**
 * Variant specs.  S = small, L = large.  h = height, r = base radius,
 * arms[] = { side (-1/+1), y = attach height, len = horizontal reach, up = vertical length }.
 */
export const CACTUS_SPECS = {
  S: [
    { h: 1, r: 0.2, arms: [{ side: 1, y: 0.42, len: 0.16, up: 0.3 }] },
    { h: 0.85, r: 0.22, arms: [], flower: true },
    {
      h: 1.1, r: 0.19,
      arms: [
        { side: -1, y: 0.5, len: 0.15, up: 0.32 },
        { side: 1, y: 0.35, len: 0.14, up: 0.22 },
      ],
    },
  ],
  L: [
    {
      h: 1.65, r: 0.26,
      arms: [
        { side: -1, y: 0.7, len: 0.22, up: 0.5 },
        { side: 1, y: 0.95, len: 0.2, up: 0.4 },
      ],
    },
    { h: 1.5, r: 0.27, arms: [{ side: 1, y: 0.75, len: 0.22, up: 0.45 }], flower: true },
    {
      h: 1.7, r: 0.25,
      arms: [
        { side: -1, y: 1, len: 0.2, up: 0.42 },
        { side: 1, y: 0.6, len: 0.24, up: 0.6 },
      ],
    },
  ],
};

/** Trunk + arms (+ optional flower) as one merged vertex-coloured geometry. */
export function buildCactusGeometry({ h, r, arms, flower }) {
  const parts = [];
  const trunkH = h - r * 0.9;
  parts.push(
    bake(new THREE.CylinderGeometry(r * 0.9, r, trunkH, 7), C.cactus, { pos: [0, trunkH / 2, 0] }),
    bake(new THREE.SphereGeometry(r * 0.9, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), C.cactus, { pos: [0, trunkH, 0] }),
  );
  for (const arm of arms) {
    const ar = r * 0.58; // arm radius
    const x0 = arm.side * r * 0.5; // where the arm leaves the trunk
    const x1 = arm.side * (r + arm.len); // vertical segment's x
    parts.push(
      // horizontal elbow
      bake(new THREE.CylinderGeometry(ar, ar, Math.abs(x1 - x0) + ar, 6), C.cactusDark, {
        pos: [(x0 + x1 + arm.side * ar) / 2, arm.y, 0],
        rot: [0, 0, Math.PI / 2],
      }),
      // upright part + rounded tip
      bake(new THREE.CylinderGeometry(ar * 0.9, ar, arm.up, 6), C.cactusDark, { pos: [x1, arm.y + arm.up / 2, 0] }),
      bake(new THREE.SphereGeometry(ar * 0.9, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), C.cactusDark, { pos: [x1, arm.y + arm.up, 0] }),
    );
  }
  if (flower) parts.push(bake(new THREE.IcosahedronGeometry(0.075, 0), C.flower, { pos: [0.03, h + 0.03, 0] }));
  return mergeAndShade(parts);
}

/** Static physics colliders (box half-extents `box`, centre `at`) approximating the cactus for the ragdoll. */
export function cactusCollisionBoxes({ h, r, arms }) {
  const shapes = [{ box: [r * 0.8, h * 0.46, r * 0.8], at: [0, h * 0.46, 0] }];
  for (const arm of arms) {
    shapes.push({ box: [r * 0.5, arm.up / 2, r * 0.5], at: [arm.side * (r + arm.len), arm.y + arm.up / 2, 0] });
  }
  return shapes;
}
