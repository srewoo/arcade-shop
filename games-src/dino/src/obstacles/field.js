// Obstacle spawning, movement, collision tests and hand-off to the physics world (bundle class `nu`).
//
// Obstacle record (all kinds):
//   kind 'cactus'|'ptero'|'weed'|'boulder'|'log'|'meteor', action = what the player must do ('jump'|'duck'|'none'),
//   group (Object3D), z (world z, player runs toward -z), vz (own speed toward +z), hz (half depth),
//   y0/y1 (vertical hit extents).
import * as THREE from 'three';
import { TUNING, PTERO_HEIGHT, PTERO_ACTION, WEED_RADIUS } from '../config.js';
import { pick, rand, weightedPick } from '../util.js';
import { pickPowerup, shouldSpawnPickup } from '../powerups.js';
import { PROP_MATERIAL } from '../gfx/geometry.js';
import { CACTUS_SPECS, buildCactusGeometry, cactusCollisionBoxes } from './cactus.js';
import { buildPteroBody, buildWing, buildWeedGeometry, flapWings } from './ptero.js';
import { spawnTable, breatherDue } from './difficulty.js';
import { GATES, HAZARD } from '../tuning.js';
import { PickupField } from './pickups.js';
import { createBoulderKind } from './boulder.js';
import { createLogKind } from './log.js';
import { createMeteorKind } from './meteor.js';
import { buildPhysicsProps } from './physicsProps.js';

const CACTUS_SPACING = 0.9; // z distance between cacti in a group
const CULL_BEHIND = 30; // remove obstacles this far behind the player

const CACTUS_GROUP_LAYOUTS = {
  group2: [['S', 'S'], ['L', 'S'], ['S', 'L'], ['L', 'L']],
  group3: [['S', 'S', 'S'], ['S', 'L', 'S'], ['S', 'S', 'L']],
};

export class ObstacleField {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    /** Obstacle kinds forced to spawn next (debug / tests), consumed before random choice. */
    this.forced = [];
    this.time = 0;
    this.cacti = {};
    for (const size of ['S', 'L']) {
      this.cacti[size] = CACTUS_SPECS[size].map((spec) => ({ spec, geo: buildCactusGeometry(spec), shapes: cactusCollisionBoxes(spec) }));
    }
    this.outlineMat = new THREE.MeshBasicMaterial({ color: HAZARD.outlineColor, side: THREE.BackSide });
    this.markGeo = new THREE.PlaneGeometry(1.7, 1);
    this.markMat = new THREE.MeshBasicMaterial({ color: HAZARD.markColor, transparent: true, opacity: HAZARD.markOpacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.pteroBody = buildPteroBody();
    this.wings = {
      inner: { [-1]: buildWing(-1, false), 1: buildWing(1, false) },
      outer: { [-1]: buildWing(-1, true), 1: buildWing(1, true) },
    };
    this.weedGeo = buildWeedGeometry();
    /** New obstacle kinds (boulder / log / meteor): { make, update, staticProps?, dynamicProp? } */
    this.impls = { boulder: createBoulderKind(), log: createLogKind(), meteor: createMeteorKind() };
    this.pickups = new PickupField(scene);
    /** Set by the run: { powerups, newObstacles, pool } (see modes.effectiveRules). */
    this.rules = { powerups: false, newObstacles: false, pool: [] };
    this.maxSpeed = TUNING.maxSpeed; // caps the spacing speed estimate (set per mode/difficulty)
    this.onMeteorLand = null;
    this.reset();
  }

  reset() {
    for (const o of this.list) this.scene.remove(o.group);
    this.list = [];
    this.pickups.reset();
    this.lastPickupAt = -Infinity;
    this.cleared = 0; // obstacles the player got past this run (run summary)
    this.breatherN = 1; // next breather (a longer gap every GATES.breatherEveryS of play) to apply
    /** z (negative) where the next obstacle will meet the player's path */
    this.nextMeet = -TUNING.firstObstacle;
  }

  /** Debug: clear the track and restart spawning `ahead` metres in front of z (used to jump the difficulty curve). */
  skipTo(z, ahead = 60) {
    this.reset();
    this.nextMeet = z - ahead;
  }

  /** Remove one obstacle (a Shield-absorbed hit, or Zen recovery). */
  destroy(o) {
    this.scene.remove(o.group);
    const i = this.list.indexOf(o);
    if (i >= 0) this.list.splice(i, 1);
  }

  /** Dark inverted-hull outline: separates a hazard from the dino body and the sand (shares the geometry, no collider). */
  _outline(mesh, geometry) {
    const o = new THREE.Mesh(geometry, this.outlineMat);
    o.scale.set(1 + HAZARD.outlineGrow, 1 + HAZARD.outlineGrow * 0.5, 1 + HAZARD.outlineGrow);
    o.renderOrder = -1;
    mesh.add(o);
  }

  /** Flat red-orange warning strip on the ground under a cactus group (telegraphs where it will hit). */
  _groundMark(group, hz) {
    const m = new THREE.Mesh(this.markGeo, this.markMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.03;
    m.scale.set(1, hz * 2 + 0.5, 1);
    m.renderOrder = -2;
    group.add(m);
  }

  _mesh(geometry, parent) {
    const m = new THREE.Mesh(geometry, PROP_MATERIAL);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  _makeCactus(sizes) {
    const group = new THREE.Group();
    const items = [];
    let tallest = 0;
    sizes.forEach((size, i) => {
      const variant = pick(this.cacti[size]);
      const mesh = this._mesh(variant.geo, group);
      const zOff = (i - (sizes.length - 1) / 2) * CACTUS_SPACING;
      mesh.position.set(rand(-0.12, 0.12), 0, zOff);
      mesh.rotation.y = rand(-0.35, 0.35);
      const scale = size === 'L' ? rand(1.1, 1.22) : rand(1.12, 1.28);
      mesh.scale.setScalar(scale);
      this._outline(mesh, variant.geo);
      items.push({ mesh, variant, scale });
      tallest = Math.max(tallest, variant.spec.h * scale);
    });
    const hz = ((sizes.length - 1) * CACTUS_SPACING) / 2 + 0.33;
    this._groundMark(group, hz);
    return {
      kind: 'cactus', action: 'jump', group, items, vz: 0,
      hz: ((sizes.length - 1) * CACTUS_SPACING) / 2 + 0.33,
      y0: 0,
      y1: tallest * 0.88,
    };
  }

  _makePtero(type) {
    const group = new THREE.Group();
    this._mesh(this.pteroBody, group);
    const wings = [-1, 1].map((side) => {
      const inner = this._mesh(this.wings.inner[side], group);
      inner.position.set(side * 0.17, 0.06, 0.1);
      const outer = this._mesh(this.wings.outer[side], inner);
      outer.position.set(side * 0.93, 0, -0.06);
      return { side, inner, outer };
    });
    const baseY = PTERO_HEIGHT[type];
    group.position.y = baseY;
    return {
      kind: 'ptero', type, action: PTERO_ACTION[type], group, wings, vz: TUNING.pteroSpeed,
      hz: 0.6, y0: baseY - 0.35, y1: baseY + 0.35, baseY, flap: rand(0, 6),
    };
  }

  _makeWeed() {
    const group = new THREE.Group();
    this._mesh(this.weedGeo, group);
    group.position.y = WEED_RADIUS;
    return { kind: 'weed', action: 'jump', group, vz: TUNING.weedSpeed, hz: 0.5, y0: 0, y1: 1.05, hop: rand(0, 6) };
  }

  _make(kind) {
    switch (kind) {
      case 'cactusS': return this._makeCactus(['S']);
      case 'cactusL': return this._makeCactus(['L']);
      case 'group2': return this._makeCactus(pick(CACTUS_GROUP_LAYOUTS.group2));
      case 'group3': return this._makeCactus(pick(CACTUS_GROUP_LAYOUTS.group3));
      case 'weed': return this._makeWeed();
      case 'boulder': case 'log': case 'meteor': {
        const o = this.impls[kind].make((geo, parent) => this._mesh(geo, parent));
        o.impl = this.impls[kind];
        return o;
      }
      default: return this._makePtero(kind); // pteroLow | pteroMid | pteroHigh
    }
  }

  /** Difficulty curve: the spawn table widens with distance travelled (metres), see difficulty.js. */
  _choose(distance) {
    return weightedPick(spawnTable(distance, this.rules));
  }

  /** Gap multiplier for the obstacle spawned at `distance`: a breather every GATES.breatherEveryS (new obstacles only). */
  _breather(distance) {
    const kin = this.rules.breather;
    if (!kin) return 1; // Classic with Classic Plus off: spacing is exactly the original
    let due = false;
    while (breatherDue(distance, this.breatherN, kin)) {
      this.breatherN++;
      due = true;
    }
    return due ? GATES.breatherGapMult : 1;
  }

  /** Maybe drop a power-up in the middle of the gap between two obstacle meeting points (never on an obstacle). */
  _maybePickup(meetA, meetB) {
    const distance = -meetA;
    const enabled = this.rules.powerups && this.rules.pool.length > 0;
    if (!shouldSpawnPickup({ enabled, distance, lastAt: this.lastPickupAt, roll: Math.random() })) return;
    const kind = pickPowerup(this.rules.pool, Math.random());
    if (!kind) return;
    this.lastPickupAt = distance;
    this.pickups.spawn(kind, (meetA + meetB) / 2);
  }

  /** Spawn obstacles (and the odd pickup) until the track is filled TUNING.spawnAhead metres in front of the player. */
  _spawnAhead(playerZ, speed) {
    while (this.nextMeet > playerZ - TUNING.spawnAhead) {
      const kind = this.forced.shift() ?? this._choose(-this.nextMeet);
      const o = this._make(kind);
      const timeUntilMeet = playerZ - this.nextMeet;
      // Moving obstacles are spawned back along their path so they arrive at nextMeet on time.
      o.z = this.nextMeet - o.vz * (timeUntilMeet / Math.max(speed, 1));
      o.group.position.z = o.z;
      this.scene.add(o.group);
      this.list.push(o);
      const nextSpeed = Math.min(this.maxSpeed, speed + 2);
      const meet = this.nextMeet;
      // gap = obstacle half-depth + 3.5 + roughly 1.05..1.9 s of travel at the (slightly boosted) speed
      let gap = o.hz + 3.5 + nextSpeed * rand(1.05, 1.9);
      const stretch = this._breather(-meet);
      if (stretch !== 1) gap *= stretch;
      this.nextMeet -= gap;
      this._maybePickup(meet, this.nextMeet);
    }
  }

  /**
   * @param spawn false during the crash cut-scene: keeps animating but neither spawns nor culls.
   */
  update(dt, playerZ, speed, spawn = true) {
    this.time += dt;
    if (spawn) this._spawnAhead(playerZ, speed);
    const ctx = { time: this.time, playerZ, speed, field: this };
    this.impls.meteor.pulse(this.time);
    this.pickups.update(dt, playerZ, this.time);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      if (o.ragdolled) {
        if (o.kind === 'ptero') flapWings(o, dt, true);
        continue;
      }
      if (o.vz) {
        o.z += o.vz * dt;
        o.group.position.z = o.z;
      }
      if (o.kind === 'ptero') {
        flapWings(o, dt, false);
        o.group.position.y = o.baseY + Math.sin(this.time * 3 + o.flap) * 0.06;
      } else if (o.kind === 'weed') {
        const hop = Math.abs(Math.sin(this.time * 4.2 + o.hop)) * 0.22;
        o.group.position.y = WEED_RADIUS + hop;
        o.group.rotation.x += (o.vz / WEED_RADIUS) * dt; // rolls toward the player
        o.y1 = 1.05 + hop;
      } else o.impl?.update(o, dt, ctx);
      if (spawn && !o.passed && o.z - o.hz > playerZ + 0.6) {
        o.passed = true;
        this.cleared++;
      }
      if (spawn && o.z > playerZ + CULL_BEHIND) {
        this.scene.remove(o.group);
        this.list.splice(i, 1);
      }
    }
  }

  /** Nearest obstacle that has not passed the player (used by the autopilot). */
  next(playerZ) {
    let best = null;
    for (const o of this.list) {
      if (o.z - o.hz > playerZ + 0.6) continue; // RE: z grows toward the camera; skip those already behind
      if (!best || o.z > best.z) best = o;
    }
    return best;
  }

  /**
   * Swept AABB test in (z, y).  `boxes` come from DinoRig.hitboxes().  The player's z-range is widened
   * by the relative closing speed so fast frames cannot tunnel.
   */
  hit(playerZ, boxes, speed, dt) {
    for (const o of this.list) {
      const back = o.z - o.hz;
      const front = o.z + o.hz;
      const sweep = (speed + o.vz) * dt;
      for (const b of boxes) {
        if (playerZ + b[0] - sweep < front && playerZ + b[1] > back && b[2] < o.y1 && b[3] > o.y0) return o;
      }
    }
    return null;
  }

  /** Ragdoll-world props for the obstacles near the player (see physicsProps.js). */
  physicsProps(hitObstacle, playerZ) {
    return buildPhysicsProps(this.list, hitObstacle, playerZ);
  }
}
