// Rapier-driven ragdoll for the crash cut-scene (bundle class `Lm`, plus `Om` = initPhysics).
//
// Model: every dino bone becomes a dynamic cuboid body.  Hinge bones (shin, foot) use revolute joints about X
// with limits; ball bones use spherical joints whose *angular limit and muscle tone are enforced manually* in
// _muscles() by applying equal/opposite torque impulses (a PD controller on the swing angle that fades out over
// `toneTime` seconds, so the dino goes from stiff to floppy).  A short "leg run" torque keeps the legs
// pedalling for `legRun` seconds after impact.  Body meshes are driven from the bodies in _sync().
import * as THREE from 'three';
import { TUNING } from '../config.js';
import { clamp, rand } from '../util.js';

/** Rapier (with its inlined WASM) is a separate chunk loaded after the first paint; resolved by initPhysics(). */
let RAPIER = null;

export async function initPhysics() {
  const mod = await import('@dimforge/rapier3d-compat');
  RAPIER = mod.default ?? mod;
  await RAPIER.init();
}

const SUBSTEP_HZ = 120; // fixed substep rate: ceil(dt * 120) substeps per frame
const IMPACT_THRESHOLD = 3.2; // m/s of unexplained velocity change that counts as an impact
const HINGE_AXIS = { x: 1, y: 0, z: 0 };

const _qParent = new THREE.Quaternion();
const _qChild = new THREE.Quaternion();
const _qRel = new THREE.Quaternion();
const _axis = new THREE.Vector3();
const _impactPos = new THREE.Vector3();

/** Rotational inertia of `body` about unit world axis `a` (a^T * I_world^-1 * a, i.e. inverse inertia). */
function inverseInertiaAbout(body, a) {
  const m = body.effectiveWorldInvInertia().elements; // symmetric 3x3, packed
  return m[0] * a.x * a.x + m[3] * a.y * a.y + m[5] * a.z * a.z + 2 * (m[1] * a.x * a.y + m[2] * a.x * a.z + m[4] * a.y * a.z);
}

const toVec = (arr) => ({ x: arr[0], y: arr[1], z: arr[2] });

export class RagdollSim {
  constructor() {
    this.world = null;
    this.active = false;
    this.onImpact = null; // (strength 0..1, worldPos) => void
    this.torsoPos = new THREE.Vector3();
    this.speed = 0; // torso speed (m/s)
  }

  /**
   * @param parts DinoRig.list entries ({def, mesh, vel, angVel})
   * @param props [{dynamic,pos,quat,shapes:[{box|ball,at}],...}] from ObstacleField.physicsProps
   * @param opts {toneTime, legRun, legPhase, legRate}
   */
  start(parts, props, opts = {}) {
    this.dispose();
    const world = (this.world = new RAPIER.World({ x: 0, y: -TUNING.ragdollGravity, z: 0 }));
    world.numSolverIterations = 8;
    this.active = true;
    this.time = 0;
    this.lastImpact = -1;
    this.settling = false;
    this.bodies = [];
    this.balls = []; // manually-limited ball joints
    this.props = []; // dynamic props whose object3d is synced
    this.byName = {};
    const groundMesh = parts[0].mesh;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(4e3, 2, 4e3).setTranslation(groundMesh.position.x, -2, groundMesh.position.z).setFriction(1).setRestitution(0.15),
    );
    for (const part of parts) this._addBone(world, part);
    for (const prop of props) this._addProp(world, prop);
    // Initial muscle-tone / leg-pedal parameters (randomised per crash)
    this.toneTime = opts.toneTime ?? rand(0.5, 1.4);
    this.legRun = opts.legRun ?? rand(0.3, 1);
    this.legPhase = opts.legPhase ?? 0;
    this.legRate = opts.legRate ?? 24;
    this._prevTorsoVel = { ...this.byName.torso.body.linvel() };
    this._prevHeadVel = { ...this.byName.head.body.linvel() };
    this._sync();
  }

  _addBone(world, part) {
    const { def, mesh } = part;
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
        .setRotation(mesh.quaternion)
        .setLinvel(part.vel.x, part.vel.y, part.vel.z)
        .setAngvel(part.angVel)
        .setLinearDamping(0.03)
        .setAngularDamping(0.5)
        .setCcdEnabled(true),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(def.size[0] / 2, def.size[1] / 2, def.size[2] / 2).setDensity(def.density).setFriction(0.8).setRestitution(0.22),
      body,
    );
    const entry = { def, mesh, body };
    this.bodies.push(entry);
    this.byName[def.name] = entry;
    if (!def.parent) return;
    const parent = this.byName[def.parent].body;
    const anchorParent = toVec(def.at);
    const anchorChild = { x: -def.off[0], y: -def.off[1], z: -def.off[2] };
    const joint = def.joint;
    if (joint.type === 'hinge') {
      const j = world.createImpulseJoint(RAPIER.JointData.revolute(anchorParent, anchorChild, HINGE_AXIS), parent, body, true);
      j.setContactsEnabled(false);
      j.setLimits(def.rest + joint.min, def.rest + joint.max);
    } else {
      const longest = Math.max(...def.size);
      world.createImpulseJoint(RAPIER.JointData.spherical(anchorParent, anchorChild), parent, body, true).setContactsEnabled(false);
      this.balls.push({
        parent,
        child: body,
        limit: joint.limit,
        inertia: (body.mass() * longest * longest * (joint.chain ?? 1)) / 3, // RE: heuristic stiffness scale, not true inertia
        restInv: new THREE.Quaternion().setFromEuler(new THREE.Euler(def.rest, 0, 0)).invert(),
      });
    }
  }

  _addProp(world, prop) {
    const quat = prop.quat ?? { x: 0, y: 0, z: 0, w: 1 };
    const desc = (prop.dynamic ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed()).setTranslation(prop.pos.x, prop.pos.y, prop.pos.z).setRotation(quat);
    if (prop.dynamic) {
      const lv = prop.linvel ?? { x: 0, y: 0, z: 0 };
      desc.setLinvel(lv.x, lv.y, lv.z).setAngvel(prop.angvel ?? { x: 0, y: 0, z: 0 }).setAngularDamping(0.4).setCcdEnabled(true);
    }
    const body = world.createRigidBody(desc);
    for (const shape of prop.shapes) {
      const cd = shape.ball ? RAPIER.ColliderDesc.ball(shape.ball) : RAPIER.ColliderDesc.cuboid(...shape.box);
      const at = shape.at ?? [0, 0, 0];
      cd.setTranslation(at[0], at[1], at[2]).setDensity(prop.density ?? 1).setFriction(prop.friction ?? 0.7).setRestitution(prop.restitution ?? 0.2);
      world.createCollider(cd, body);
    }
    if (prop.dynamic && prop.object3d) this.props.push({ body, object3d: prop.object3d });
  }

  /** Multiply horizontal velocity of the named bodies (used to stall the legs on a tumbleweed hit). */
  scaleVelocity(names, factor) {
    for (const name of names) {
      const body = this.byName[name]?.body;
      if (!body) continue;
      const v = body.linvel();
      body.setLinvel({ x: v.x * factor, y: v.y, z: v.z * factor }, true);
    }
  }

  /** Add a linear velocity `lin` and an angular velocity `ang` (about the torso) to every bone: a rigid-body kick. */
  nudge(lin, ang) {
    const c = this.byName.torso.body.translation();
    for (const { body } of this.bodies) {
      const p = body.translation(), v = body.linvel(), w = body.angvel();
      const rx = p.x - c.x, ry = p.y - c.y, rz = p.z - c.z;
      body.setLinvel(
        { x: v.x + lin.x + ang.y * rz - ang.z * ry, y: v.y + lin.y + ang.z * rx - ang.x * rz, z: v.z + lin.z + ang.x * ry - ang.y * rx },
        true,
      );
      body.setAngvel({ x: w.x + ang.x, y: w.y + ang.y, z: w.z + ang.z }, true);
    }
  }

  step(dt) {
    if (!this.active || dt <= 0) return;
    const n = Math.max(1, Math.ceil(dt * SUBSTEP_HZ - 1e-6));
    const h = dt / n;
    for (let i = 0; i < n; i++) this._substep(h);
    this._sync();
  }

  _substep(h) {
    const world = this.world;
    this.time += h;
    this._muscles(h);
    world.timestep = h;
    world.step();
    if (!this.settling && this.time > 1.2 && this.speed < 2) {
      // once the body has basically stopped, damp hard so it lies still instead of jittering
      this.settling = true;
      for (const { body } of this.bodies) {
        body.setAngularDamping(4);
        body.setLinearDamping(0.6);
      }
    }
    this._detectImpact(h);
  }

  /** Impact = change in torso/head velocity not explained by gravity this substep. */
  _detectImpact(h) {
    const g = TUNING.ragdollGravity * h;
    const torso = this.byName.torso.body, head = this.byName.head.body;
    const tv = torso.linvel(), hv = head.linvel();
    const dTorso = Math.hypot(tv.x - this._prevTorsoVel.x, tv.y - this._prevTorsoVel.y + g, tv.z - this._prevTorsoVel.z);
    const dHead = Math.hypot(hv.x - this._prevHeadVel.x, hv.y - this._prevHeadVel.y + g, hv.z - this._prevHeadVel.z);
    this._prevTorsoVel = { x: tv.x, y: tv.y, z: tv.z };
    this._prevHeadVel = { x: hv.x, y: hv.y, z: hv.z };
    const dv = Math.max(dTorso, dHead * 0.6);
    if (dv > IMPACT_THRESHOLD && this.time - this.lastImpact > 0.09 && this.onImpact) {
      this.lastImpact = this.time;
      const p = (dTorso >= dHead * 0.6 ? torso : head).translation();
      this.onImpact(clamp((dv - IMPACT_THRESHOLD) / 14, 0.08, 1), _impactPos.set(p.x, p.y, p.z));
    }
  }

  /** Muscle model: PD torque on each ball joint (limit spring + tone spring + damping), plus the leg-pedal. */
  _muscles(h) {
    const tone = Math.max(0.06, 1 - this.time / this.toneTime); // 1 -> 0.06 over toneTime
    for (const j of this.balls) {
      const rp = j.parent.rotation(), rc = j.child.rotation();
      _qParent.set(rp.x, rp.y, rp.z, rp.w);
      _qChild.set(rc.x, rc.y, rc.z, rc.w);
      // rotation of child relative to parent, relative to rest pose
      _qRel.copy(_qParent).invert().multiply(_qChild).multiply(j.restInv);
      if (_qRel.w < 0) _qRel.set(-_qRel.x, -_qRel.y, -_qRel.z, -_qRel.w);
      const s = Math.hypot(_qRel.x, _qRel.y, _qRel.z);
      if (s < 1e-4) continue;
      const angle = 2 * Math.atan2(s, _qRel.w);
      _axis.set(_qRel.x / s, _qRel.y / s, _qRel.z / s).applyQuaternion(_qParent); // world axis
      const overshoot = Math.max(0, angle - j.limit);
      const wc = j.child.angvel(), wp = j.parent.angvel();
      const relSpin = (wc.x - wp.x) * _axis.x + (wc.y - wp.y) * _axis.y + (wc.z - wp.z) * _axis.z;
      const invI = inverseInertiaAbout(j.child, _axis) + inverseInertiaAbout(j.parent, _axis);
      const cap = (x) => (0.3 * x) / (h * invI); // never correct more than 0.3 of the error in one step
      let torque = Math.min(420 * overshoot * j.inertia * h, cap(overshoot)) + Math.min(150 * tone * angle * j.inertia * h, cap(angle));
      const damping = (overshoot > 0 ? 22 : Math.max(9 * tone, 2.5)) * relSpin * j.inertia * h;
      torque += clamp(damping, (-0.6 * Math.abs(relSpin)) / invI, (0.6 * Math.abs(relSpin)) / invI);
      torque = clamp(torque, -4, 4);
      if (Math.abs(torque) < 1e-6) continue;
      j.child.applyTorqueImpulse({ x: -_axis.x * torque, y: -_axis.y * torque, z: -_axis.z * torque }, true);
      j.parent.applyTorqueImpulse({ x: _axis.x * torque, y: _axis.y * torque, z: _axis.z * torque }, true);
    }
    if (this.time < this.legRun) this._pedalLegs(h);
  }

  /** Sinusoidal opposite torques on the thighs (about torso X) so the legs keep running briefly after the hit. */
  _pedalLegs(h) {
    const fade = 1 - this.time / this.legRun;
    const torso = this.byName.torso.body;
    const r = torso.rotation();
    _qParent.set(r.x, r.y, r.z, r.w);
    _axis.set(1, 0, 0).applyQuaternion(_qParent);
    const phase = this.legPhase + this.time * this.legRate;
    for (const [name, offset] of [['thighL', 0], ['thighR', Math.PI]]) {
      const thigh = this.byName[name].body;
      const s = Math.cos(phase + offset) * 0.11 * fade * h * 60;
      thigh.applyTorqueImpulse({ x: _axis.x * s, y: _axis.y * s, z: _axis.z * s }, true);
      torso.applyTorqueImpulse({ x: -_axis.x * s, y: -_axis.y * s, z: -_axis.z * s }, true);
    }
  }

  _sync() {
    for (const { mesh, body } of this.bodies) {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
    }
    for (const { object3d, body } of this.props) {
      object3d.position.copy(body.translation());
      object3d.quaternion.copy(body.rotation());
    }
    const torso = this.byName.torso.body;
    this.torsoPos.copy(torso.translation());
    const v = torso.linvel();
    this.speed = Math.hypot(v.x, v.y, v.z);
  }

  dispose() {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.active = false;
    this.bodies = [];
    this.balls = [];
    this.props = [];
    this.byName = {};
  }
}
