// Low-hanging log: a trunk slung between two stumps with a leafy branch on top.  It fills everything from
// head height up, so jumping cannot clear it - the player has to duck.
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { rand } from '../util.js';
import { bake, mergeAndShade, jitter } from '../gfx/geometry.js';

const WOOD = 0x8a5a34;
const WOOD_DARK = 0x5e3a20;
const WOOD_END = 0xc9a06a;
const LEAF = 0x6b8f3a;
const BAR_Y = 2.2; // trunk centre height; its underside (1.86) clears a ducking dino (head top 1.68)
const BAR_R = 0.34;
const HALF_SPAN = 2.2;

function buildLogGeometry() {
  const parts = [
    bake(new THREE.CylinderGeometry(BAR_R, BAR_R * 1.06, HALF_SPAN * 2 + 0.5, 8), WOOD, { pos: [0, BAR_Y, 0], rot: [0, 0, Math.PI / 2], warp: jitter(0.04) }),
    bake(new THREE.CylinderGeometry(BAR_R * 0.86, BAR_R * 0.86, 0.06, 8), WOOD_END, { pos: [HALF_SPAN + 0.27, BAR_Y, 0], rot: [0, 0, Math.PI / 2] }),
    bake(new THREE.CylinderGeometry(BAR_R * 0.86, BAR_R * 0.86, 0.06, 8), WOOD_END, { pos: [-HALF_SPAN - 0.27, BAR_Y, 0], rot: [0, 0, Math.PI / 2] }),
  ];
  for (const side of [-1, 1]) {
    parts.push(bake(new THREE.CylinderGeometry(0.3, 0.38, 1.9, 7), WOOD_DARK, { pos: [side * HALF_SPAN, 0.95, 0], warp: jitter(0.06) }));
  }
  for (let i = 0; i < 6; i++) {
    const x = -1.7 + i * 0.68 + rand(-0.12, 0.12);
    parts.push(bake(new THREE.IcosahedronGeometry(rand(0.34, 0.5), 0), i % 2 ? LEAF : C.cactus, { pos: [x, BAR_Y + 0.55 + rand(0, 0.6), rand(-0.1, 0.1)], warp: jitter(0.15) }));
  }
  return mergeAndShade(parts);
}

export function createLogKind() {
  const geo = buildLogGeometry();
  const shapes = [
    { box: [HALF_SPAN + 0.25, BAR_R, BAR_R], at: [0, BAR_Y, 0] },
    { box: [0.32, 0.95, 0.32], at: [-HALF_SPAN, 0.95, 0] },
    { box: [0.32, 0.95, 0.32], at: [HALF_SPAN, 0.95, 0] },
  ];
  return {
    make(mesh) {
      const group = new THREE.Group();
      mesh(geo, group);
      return { kind: 'log', action: 'duck', group, vz: 0, hz: 0.45, y0: BAR_Y - BAR_R - 0.02, y1: 3.6 };
    },
    update() {},
    staticProps: (o) => [{ dynamic: false, pos: o.group.position.clone(), friction: 0.6, shapes }],
  };
}
