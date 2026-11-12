// Power-up pickups: floating spinning gems that sit in the gaps between obstacles (never on top of one), so
// spawning them cannot make a section harder.  They are unlit so they stay readable at night.
import * as THREE from 'three';
import { POWERUPS } from '../powerups.js';
import { bake, mergeAndShade, box } from '../gfx/geometry.js';

const HEIGHT = 1.35; // hover height: reachable by simply running through, or from the top of a jump
const HALF_DEPTH = 0.8;
const CULL_BEHIND = 30;
const WHITE = 0xffffff;

const MATERIAL = new THREE.MeshBasicMaterial({ vertexColors: true });

function buildCore(kind) {
  const color = new THREE.Color(POWERUPS[kind].color).getHex();
  switch (kind) {
    case 'shield':
      return mergeAndShade([bake(new THREE.OctahedronGeometry(0.42), color, { scale: [1, 1.25, 1] })]);
    case 'doublejump':
      return mergeAndShade([
        bake(new THREE.ConeGeometry(0.32, 0.46, 4), color, { pos: [0, -0.2, 0], rot: [0, Math.PI / 4, 0] }),
        bake(new THREE.ConeGeometry(0.32, 0.46, 4), WHITE, { pos: [0, 0.22, 0], rot: [0, Math.PI / 4, 0] }),
      ]);
    case 'slowmo':
      return mergeAndShade([
        bake(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 14), color, { rot: [Math.PI / 2, 0, 0] }),
        bake(box(0.05, 0.26, 0.17), WHITE, { pos: [0, 0.1, 0] }),
        bake(box(0.2, 0.05, 0.17), WHITE, { pos: [0.08, 0, 0] }),
      ]);
    default: // score2
      return mergeAndShade([
        bake(new THREE.IcosahedronGeometry(0.42, 0), color),
        bake(box(0.5, 0.09, 0.1), WHITE, { pos: [0, 0, 0.36], rot: [0, 0, 0.7] }),
        bake(box(0.5, 0.09, 0.1), WHITE, { pos: [0, 0, 0.36], rot: [0, 0, -0.7] }),
      ]);
  }
}

export class PickupField {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.cores = {};
    this.rings = {};
    for (const kind of Object.keys(POWERUPS)) {
      this.cores[kind] = buildCore(kind);
      this.rings[kind] = new THREE.MeshBasicMaterial({ color: POWERUPS[kind].color, transparent: true, opacity: 0.7, depthWrite: false });
    }
    this.ringGeo = new THREE.TorusGeometry(0.78, 0.045, 6, 22);
  }

  reset() {
    for (const p of this.list) this.scene.remove(p.group);
    this.list = [];
  }

  spawn(kind, z) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(this.cores[kind], MATERIAL), new THREE.Mesh(this.ringGeo, this.rings[kind]));
    group.position.set(0, HEIGHT, z);
    this.scene.add(group);
    this.list.push({ kind, group, z, phase: Math.random() * 6 });
  }

  update(dt, playerZ, time) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.z > playerZ + CULL_BEHIND) {
        this.scene.remove(p.group);
        this.list.splice(i, 1);
        continue;
      }
      p.group.position.y = HEIGHT + Math.sin(time * 3 + p.phase) * 0.12;
      p.group.children[0].rotation.y += dt * 2.4;
      p.group.children[1].rotation.x = Math.PI / 2 + Math.sin(time * 2 + p.phase) * 0.3;
    }
  }

  /** Remove and return the kinds the dino (hit boxes from DinoRig.hitboxes) is touching this frame. */
  collect(playerZ, boxes, speed, dt) {
    const got = [];
    const sweep = speed * dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      const touching = boxes.some(
        (b) => playerZ + b[0] - sweep < p.z + HALF_DEPTH && playerZ + b[1] > p.z - HALF_DEPTH && b[2] < HEIGHT + 0.7 && b[3] > HEIGHT - 0.7,
      );
      if (!touching) continue;
      got.push(p.kind);
      this.scene.remove(p.group);
      this.list.splice(i, 1);
    }
    return got;
  }
}
