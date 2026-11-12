// Dino skeleton definition shared by the animated rig (dino/rig.js) and the ragdoll (physics/ragdoll.js).
// Bundle symbols: Fl REST_PITCH, Il legChain, Ll BONES, Vl FOOT_CONTACTS, zl EYE.
//
// Per bone:
//   name/parent  tree
//   mesh         key into dino/parts.js PART_BUILDERS (shared geometry between L/R)
//   at           pivot position in the parent's bone space
//   off          mesh offset from the pivot (so the pivot sits at the joint)
//   size         physics box (full extents) for the ragdoll collider
//   density      collider density
//   rest         rest pitch (rad) about X, relative to parent
//   joint        ragdoll joint: ball {limit rad, chain = inertia multiplier} | hinge {min,max rad about X}
import * as THREE from 'three';

export const REST_PITCH = {
  torso: 0.2,
  neck: 0.75,
  head: -0.95,
  tail: [-0.25, -0.08, -0.08],
  thigh: 0.35,
  shin: -1.25,
  foot: 0.7,
  arm: 0.6,
};

/** side: -1 = left, +1 = right */
const legChain = (side, suffix) => [
  {
    name: `thigh${suffix}`, parent: 'torso', mesh: 'thigh', side,
    at: [0.4 * side, -0.12, 0.12], off: [0, -0.36, 0], size: [0.32, 0.85, 0.44], density: 1,
    rest: REST_PITCH.thigh, joint: { type: 'ball', limit: 0.9, chain: 2.5 },
  },
  {
    name: `shin${suffix}`, parent: `thigh${suffix}`, mesh: 'shin', side,
    at: [0, -0.4, 0], off: [0, -0.38, 0], size: [0.2, 0.84, 0.24], density: 1,
    rest: REST_PITCH.shin, joint: { type: 'hinge', min: -1.1, max: 0.9 },
  },
  {
    name: `foot${suffix}`, parent: `shin${suffix}`, mesh: 'foot', side,
    at: [0, -0.4, 0], off: [0, -0.06, -0.2], size: [0.32, 0.16, 0.75], density: 1,
    rest: REST_PITCH.foot, joint: { type: 'hinge', min: -0.7, max: 0.7 },
  },
];

export const BONES = [
  { name: 'torso', parent: null, mesh: 'torso', at: [0, 0, 0], off: [0, 0, 0], size: [0.8, 0.84, 1.5], density: 1, rest: REST_PITCH.torso },
  {
    name: 'neck', parent: 'torso', mesh: 'neck', at: [0, 0.25, -0.72], off: [0, 0, -0.3],
    size: [0.46, 0.48, 0.7], density: 0.8, rest: REST_PITCH.neck, joint: { type: 'ball', limit: 0.5, chain: 3 },
  },
  {
    name: 'head', parent: 'neck', mesh: 'head', at: [0, 0.05, -0.33], off: [0, 0.1, -0.45],
    size: [0.9, 0.78, 1.5], scale: 1.3, density: 0.55, rest: REST_PITCH.head, joint: { type: 'ball', limit: 0.6, chain: 1 },
  },
  {
    name: 'tail1', parent: 'torso', mesh: 'tail1', at: [0, 0.02, 0.76], off: [0, 0, 0.38],
    size: [0.56, 0.58, 0.8], density: 0.7, rest: REST_PITCH.tail[0], joint: { type: 'ball', limit: 0.5, chain: 2.5 },
  },
  {
    name: 'tail2', parent: 'tail1', mesh: 'tail2', at: [0, 0, 0.4], off: [0, 0, 0.36],
    size: [0.4, 0.42, 0.76], density: 0.6, rest: REST_PITCH.tail[1], joint: { type: 'ball', limit: 0.6, chain: 1.6 },
  },
  {
    name: 'tail3', parent: 'tail2', mesh: 'tail3', at: [0, 0, 0.37], off: [0, 0, 0.36],
    size: [0.22, 0.22, 0.74], density: 0.5, rest: REST_PITCH.tail[2], joint: { type: 'ball', limit: 0.7, chain: 1 },
  },
  ...legChain(-1, 'L'),
  ...legChain(1, 'R'),
  {
    name: 'armL', parent: 'torso', mesh: 'arm', side: -1, at: [-0.37, -0.18, -0.66], off: [0, -0.15, 0],
    size: [0.13, 0.44, 0.14], density: 1, rest: REST_PITCH.arm, joint: { type: 'ball', limit: 1.2, chain: 1 },
  },
  {
    name: 'armR', parent: 'torso', mesh: 'arm', side: 1, at: [0.37, -0.18, -0.66], off: [0, -0.15, 0],
    size: [0.13, 0.44, 0.14], density: 1, rest: REST_PITCH.arm, joint: { type: 'ball', limit: 1.2, chain: 1 },
  },
];

/** Foot-bone-local points used to find the lowest foot and plant the dino on the ground. */
export const FOOT_CONTACTS = [new THREE.Vector3(0, -0.08, -0.375), new THREE.Vector3(0, -0.08, 0.375)];

/** Eye position (head-local, x mirrored) and radius. */
export const EYE = { x: 0.32, y: 0.07, z: 0.1, r: 0.12 };
