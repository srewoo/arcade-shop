// Rolling boulder: a big lumpy rock that rolls toward the player (jump over it).
import * as THREE from 'three';
import { PALETTE as C } from '../config.js';
import { rand } from '../util.js';
import { bake, mergeAndShade, jitter } from '../gfx/geometry.js';

export const BOULDER_RADIUS = 0.78;
const BOULDER_SPEED = 7; // rolls toward the player at this speed (world units / s)
const MOSS = 0x7f8a52;

function buildBoulderGeometry() {
  const r = BOULDER_RADIUS;
  const parts = [bake(new THREE.IcosahedronGeometry(r, 1), C.rock, { warp: jitter(0.1) })];
  for (let i = 0; i < 5; i++) {
    const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(r * 0.82);
    parts.push(bake(new THREE.IcosahedronGeometry(r * rand(0.22, 0.34), 0), i % 2 ? C.sandDark : MOSS, { pos: dir.toArray(), warp: jitter(0.2) }));
  }
  return mergeAndShade(parts);
}

export function createBoulderKind() {
  const geo = buildBoulderGeometry();
  return {
    make(mesh) {
      const group = new THREE.Group();
      mesh(geo, group);
      group.position.y = BOULDER_RADIUS;
      return { kind: 'boulder', action: 'jump', group, vz: BOULDER_SPEED, hz: 0.7, y0: 0, y1: 1.45, bounce: rand(0, 6) };
    },
    update(o, dt, { time }) {
      o.group.position.y = BOULDER_RADIUS + Math.abs(Math.sin(time * 3 + o.bounce)) * 0.05;
      o.group.rotation.x += (o.vz / BOULDER_RADIUS) * dt; // rolls toward the player
    },
    dynamicProp(o) {
      return {
        dynamic: true, object3d: o.group, pos: o.group.position.clone(), quat: o.group.quaternion.clone(),
        linvel: { x: rand(-1, 1), y: 2.5, z: o.vz }, angvel: { x: o.vz / BOULDER_RADIUS, y: 0, z: 0 },
        density: 1.1, restitution: 0.35, shapes: [{ ball: BOULDER_RADIUS }],
      };
    },
  };
}
